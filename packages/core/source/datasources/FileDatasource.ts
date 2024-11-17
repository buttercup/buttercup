import fs from "fs";
import path from "path";
import pify from "pify";
import { TextDatasource } from "./TextDatasource.js";
import { fireInstantiationHandlers, registerDatasource } from "./register.js";
import { Credentials } from "../credentials/Credentials.js";
import { getCredentials } from "../credentials/memory/credentials.js";
import { ATTACHMENT_EXT } from "../tools/attachments.js";
import {
    AttachmentDetails,
    BufferLike,
    DatasourceConfigurationFile,
    DatasourceLoadedData,
    EncryptedContent,
    History,
    VaultID
} from "../types.js";

/**
 * File datasource for loading and saving files
 * @augments TextDatasource
 * @memberof module:Buttercup
 */
export class FileDatasource extends TextDatasource {
    _filename: string;
    mkdir: Function;
    readFile: Function;
    stat: Function;
    unlink: Function;
    writeFile: Function;

    /**
     * Constructor for the file datasource
     * @param credentials The credentials instance with which to
     *  use to configure the datasource
     */
    constructor(credentials: Credentials) {
        super(credentials);
        const { data: credentialData } = getCredentials(credentials.id);
        const { datasource: datasourceConfig } = credentialData as {
            datasource: DatasourceConfigurationFile;
        };
        const { path } = datasourceConfig;
        this._filename = path;
        this.mkdir = pify(fs.mkdir);
        this.readFile = pify(fs.readFile);
        this.stat = pify(fs.stat);
        this.unlink = pify(fs.unlink);
        this.writeFile = pify(fs.writeFile);
        this.type = "file";
        fireInstantiationHandlers("file", this);
    }

    get baseDir(): string {
        return path.dirname(this.path);
    }

    /**
     * The file path
     * @memberof FileDatasource
     */
    get path() {
        return this._filename;
    }

    /**
     * Ensure attachment paths exist
     * @memberof FileDatasource
     * @protected
     */
    async _ensureAttachmentsPaths(vaultID: VaultID): Promise<void> {
        const attachmentsDir = path.join(this.baseDir, ".buttercup", vaultID);
        await this.mkdir(attachmentsDir, { recursive: true });
    }

    /**
     * Get encrypted attachment
     * - Loads the attachment contents from a file into a buffer
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @memberof FileDatasource
     */
    async getAttachment(vaultID: VaultID, attachmentID: string): Promise<BufferLike> {
        await this._ensureAttachmentsPaths(vaultID);
        const attachmentPath = path.join(
            this.baseDir,
            ".buttercup",
            vaultID,
            `${attachmentID}.${ATTACHMENT_EXT}`
        );
        return this.readFile(attachmentPath);
    }

    /**
     * Get the datasource configuration
     * @memberof FileDatasource
     */
    getConfiguration(): DatasourceConfigurationFile {
        return {
            type: "file",
            path: this._filename
        };
    }

    /**
     * Load from the filename specified in the constructor using a password
     * @param credentials The credentials for decryption
     * @returns A promise resolving with archive history
     * @memberof FileDatasource
     */
    async load(credentials: Credentials): Promise<DatasourceLoadedData> {
        if (this.hasContent) {
            return super.load(credentials);
        }
        const contents = await this.readFile(this.path, "utf8");
        this.setContent(contents);
        return super.load(credentials);
    }

    /**
     * Put attachment data
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @param buffer The attachment data
     * @param details The attachment details
     * @memberof FileDatasource
     */
    async putAttachment(
        vaultID: VaultID,
        attachmentID: string,
        buffer: BufferLike,
        details: AttachmentDetails
    ): Promise<void> {
        await this._ensureAttachmentsPaths(vaultID);
        const attachmentPath = path.join(
            this.baseDir,
            ".buttercup",
            vaultID,
            `${attachmentID}.${ATTACHMENT_EXT}`
        );
        await this.writeFile(attachmentPath, buffer);
    }

    /**
     * Remove an attachment
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @memberof FileDatasource
     */
    async removeAttachment(vaultID: VaultID, attachmentID: string): Promise<void> {
        await this._ensureAttachmentsPaths(vaultID);
        const attachmentPath = path.join(
            this.baseDir,
            ".buttercup",
            vaultID,
            `${attachmentID}.${ATTACHMENT_EXT}`
        );
        await this.unlink(attachmentPath);
    }

    /**
     * Save archive history to a file
     * @param history The archive history to save
     * @param credentials The credentials to save with
     * @returns A promise that resolves when saving is complete
     * @memberof FileDatasource
     */
    save(history: History, credentials: Credentials): Promise<EncryptedContent> {
        return super
            .save(history, credentials)
            .then((encrypted) => this.writeFile(this.path, encrypted));
    }

    /**
     * Whether or not the datasource supports attachments
     * @memberof FileDatasource
     */
    supportsAttachments(): boolean {
        return true;
    }

    /**
     * Whether or not the datasource supports bypassing remote fetch operations
     * @returns True if content can be set to bypass fetch operations,
     *  false otherwise
     * @memberof FileDatasource
     */
    supportsRemoteBypass(): boolean {
        return true;
    }
}

registerDatasource("file", FileDatasource);
