import { TextDatasource } from "./TextDatasource.js";
import { fireInstantiationHandlers, registerDatasource } from "./register.js";
import { Credentials } from "../credentials/Credentials.js";
import { getCredentials } from "../credentials/memory/credentials.js";
import { getSharedAppEnv } from "../env/appEnv.js";
import {
    DatasourceConfigurationDropbox,
    DatasourceLoadedData,
    EncryptedContent,
    History
} from "../types.js";

/**
 * Datasource for Dropbox archives
 * @augments TextDatasource
 * @memberof module:Buttercup
 */
export default class DropboxDatasource extends TextDatasource {
    client: any;
    path: string;
    token: string;

    /**
     * Datasource for Dropbox accounts
     * @param credentials Credentials instance to configure the
     *  datsource with
     */
    constructor(credentials: Credentials) {
        super(credentials);
        const { data: credentialData } = getCredentials(credentials.id);
        const { datasource: datasourceConfig } = credentialData as {
            datasource: DatasourceConfigurationDropbox;
        };
        const { token, path } = datasourceConfig;
        this.path = path;
        this.token = token;
        const createClient = getSharedAppEnv().getProperty("net/dropbox/v1/newClient");
        this.client = createClient(token);
        this.type = "dropbox";
        fireInstantiationHandlers("dropbox", this);
    }

    /**
     * Get the datasource configuration
     * @memberof DropboxDatasource
     */
    getConfiguration(): DatasourceConfigurationDropbox {
        return {
            type: "dropbox",
            token: this.token,
            path: this.path
        };
    }

    /**
     * Load an archive from the datasource
     * @param credentials The credentials for decryption
     * @returns A promise that resolves archive history
     * @memberof DropboxDatasource
     */
    load(credentials: Credentials): Promise<DatasourceLoadedData> {
        if (this.hasContent) {
            return super.load(credentials);
        }
        return this.client.getFileContents(this.path).then((content) => {
            this.setContent(content);
            return super.load(credentials);
        });
    }

    /**
     * Save an archive using the datasource
     * @param history The archive history to save
     * @param credentials The credentials to save with
     * @returns A promise that resolves when saving has completed
     * @memberof DropboxDatasource
     */
    save(history: History, credentials: Credentials): Promise<EncryptedContent> {
        return super
            .save(history, credentials)
            .then((encryptedContent: EncryptedContent) =>
                this.client.putFileContents(this.path, encryptedContent)
            );
    }

    /**
     * Whether or not the datasource supports bypassing remote fetch operations
     * @returns True if content can be set to bypass fetch operations,
     *  false otherwise
     * @memberof DropboxDatasource
     */
    supportsRemoteBypass(): boolean {
        return true;
    }
}

registerDatasource("dropbox", DropboxDatasource);
