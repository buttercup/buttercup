import { AuthType, WebDAVClient } from "webdav";
import type { createClient as createWebDAVClient } from "webdav";
import pathPosix from "path-posix";
import { TextDatasource } from "./TextDatasource.js";
import { fireInstantiationHandlers, registerDatasource } from "./register.js";
import { getSharedAppEnv } from "../env/appEnv.js";
import { Credentials } from "../credentials/Credentials.js";
import { getCredentials } from "../credentials/memory/credentials.js";
import { ATTACHMENT_EXT } from "../tools/attachments.js";
import {
    AttachmentDetails,
    BufferLike,
    DatasourceConfigurationWebDAV,
    DatasourceLoadedData,
    History,
    VaultID
} from "../types.js";

const MAX_DATA_SIZE = 200 * 1024 * 1024; // 200 MB

/**
 * WebDAV datasource for reading and writing remote archives
 * @augments TextDatasource
 * @memberof module:Buttercup
 */
export default class WebDAVDatasource extends TextDatasource {
    protected _client: WebDAVClient;
    private _config: DatasourceConfigurationWebDAV;
    protected _path: string;

    /**
     * Constructor for the datasource
     * @param credentials Credentials for the datasource
     */
    constructor(credentials: Credentials) {
        super(credentials);
        const { data: credentialData } = getCredentials(credentials.id);
        const { datasource: datasourceConfig } = credentialData as {
            datasource: DatasourceConfigurationWebDAV;
        };
        const { endpoint, password, path, username } = (this._config = datasourceConfig);
        this._path = path;
        const createClient = getSharedAppEnv().getProperty(
            "net/webdav/v1/newClient"
        ) as typeof createWebDAVClient;
        if (typeof username === "string" && typeof password === "string") {
            this._client = createClient(endpoint, {
                authType: AuthType.Auto,
                username,
                password,
                maxBodyLength: MAX_DATA_SIZE,
                maxContentLength: MAX_DATA_SIZE
            });
        } else {
            this._client = createClient(endpoint, {
                maxBodyLength: MAX_DATA_SIZE,
                maxContentLength: MAX_DATA_SIZE
            });
        }
        this.type = "webdav";
        fireInstantiationHandlers("webdav", this);
    }

    /**
     * The vault file's base directory
     * @memberof WebDAVDatasource
     */
    get baseDir() {
        return pathPosix.dirname(this.path);
    }

    /**
     * The WebDAV client instance
     * @memberof WebDAVDatasource
     */
    get client() {
        return this._client;
    }

    /**
     * The remote archive path
     * @memberof WebDAVDatasource
     */
    get path() {
        return this._path;
    }

    /**
     * Ensure attachment paths exist
     * @memberof WebDAVDatasource
     * @protected
     */
    async _ensureAttachmentsPaths(vaultID: VaultID): Promise<void> {
        const attachmentsDir = pathPosix.join(this.baseDir, ".buttercup", vaultID);
        await this.client.createDirectory(attachmentsDir, { recursive: true });
    }

    /**
     * Get encrypted attachment
     * - Loads the attachment contents from a file into a buffer
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @memberof WebDAVDatasource
     */
    async getAttachment(vaultID: VaultID, attachmentID: string): Promise<BufferLike> {
        await this._ensureAttachmentsPaths(vaultID);
        const attachmentPath = pathPosix.join(
            this.baseDir,
            ".buttercup",
            vaultID,
            `${attachmentID}.${ATTACHMENT_EXT}`
        );
        return this.client.getFileContents(attachmentPath) as Promise<BufferLike>;
    }

    /**
     * Get the datasource configuration
     * @memberof WebDAVDatasource
     */
    getConfiguration(): DatasourceConfigurationWebDAV {
        return this._config;
    }

    /**
     * Load archive history from the datasource
     * @param credentials The credentials for archive decryption
     * @returns A promise resolving archive history
     * @memberof WebDAVDatasource
     */
    load(credentials: Credentials): Promise<DatasourceLoadedData> {
        return this.hasContent
            ? super.load(credentials)
            : this.client.getFileContents(this.path, { format: "text" }).then((content) => {
                  this.setContent(content as string);
                  return super.load(credentials);
              });
    }

    /**
     * Put attachment data
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @param buffer The attachment data
     * @param details The attachment details
     * @memberof WebDAVDatasource
     */
    async putAttachment(
        vaultID: VaultID,
        attachmentID: string,
        buffer: BufferLike,
        details: AttachmentDetails
    ): Promise<void> {
        await this._ensureAttachmentsPaths(vaultID);
        const attachmentPath = pathPosix.join(
            this.baseDir,
            ".buttercup",
            vaultID,
            `${attachmentID}.${ATTACHMENT_EXT}`
        );
        await this.client.putFileContents(attachmentPath, buffer);
    }

    /**
     * Remove an attachment
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @memberof WebDAVDatasource
     */
    async removeAttachment(vaultID: VaultID, attachmentID: string): Promise<void> {
        await this._ensureAttachmentsPaths(vaultID);
        const attachmentPath = pathPosix.join(
            this.baseDir,
            ".buttercup",
            vaultID,
            `${attachmentID}.${ATTACHMENT_EXT}`
        );
        await this.client.deleteFile(attachmentPath);
    }

    /**
     * Save archive contents to the WebDAV service
     * @param history Archive history
     * @param credentials The credentials for encryption
     * @returns A promise resolving when the save is complete
     * @memberof WebDAVDatasource
     */
    async save(history: History, credentials: Credentials): Promise<any> {
        const content = await super.save(history, credentials);
        await this.client.putFileContents(this.path, content);
    }

    /**
     * Whether or not the datasource supports attachments
     * @memberof WebDAVDatasource
     */
    supportsAttachments(): boolean {
        return true;
    }

    /**
     * Whether or not the datasource supports bypassing remote fetch operations
     * @returns True if content can be set to bypass fetch operations,
     *  false otherwise
     * @memberof WebDAVDatasource
     */
    supportsRemoteBypass(): boolean {
        return true;
    }
}

registerDatasource("webdav", WebDAVDatasource);
