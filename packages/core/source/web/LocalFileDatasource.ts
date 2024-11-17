import { fireInstantiationHandlers, registerDatasource } from "../datasources/register.js";
import { TextDatasource } from "../datasources/TextDatasource.js";
import { getCredentials } from "../credentials/memory/credentials.js";
import { buildClient } from "./localFileClient.js";
import { Credentials } from "../credentials/Credentials.js";
import {
    CredentialsPayload,
    DatasourceConfiguration,
    DatasourceLoadedData,
    EncryptedContent,
    History
} from "../types.js";

/**
 * Local file datasource, connecting via the desktop
 * application proxy from the browser
 * @memberof module:Buttercup
 * @augments TextDatasource
 */
export default class LocalFileDatasource extends TextDatasource {
    _path: string;
    _token: string;
    client: any;

    constructor(credentials: Credentials) {
        super(credentials);
        const { data: credentialData } = getCredentials(credentials.id) as CredentialsPayload;
        const { datasource: datasourceConfig } = credentialData;
        const { path, token } = datasourceConfig as DatasourceConfiguration;
        this._path = path;
        this._token = token;
        this.client = buildClient(token);
        this.type = "localfile";
        fireInstantiationHandlers("localfile", this);
    }

    get path() {
        return this._path;
    }

    get token() {
        return this._token;
    }

    /**
     * Load archive history from the datasource
     * @param credentials The credentials for archive decryption
     * @returns A promise resolving archive history
     * @memberof LocalFileDatasource
     */
    load(credentials: Credentials): Promise<DatasourceLoadedData> {
        const readProc = new Promise<string>((resolve, reject) => {
            this.client.readFile(this.path, (err: Error | null, content: string) => {
                if (err) {
                    return reject(err);
                }
                resolve(content);
            });
        });
        return readProc.then((content: string) => {
            this.setContent(content);
            return super.load(credentials);
        });
    }

    /**
     * Save archive contents to the WebDAV service
     * @param history Archive history
     * @param credentials The credentials for encryption
     * @returns A promise resolving when the save is complete
     * @memberof LocalFileDatasource
     */
    save(history: History, credentials: Credentials): Promise<EncryptedContent> {
        return super.save(history, credentials).then(
            (encrypted) =>
                new Promise((resolve, reject) => {
                    this.client.writeFile(this.path, encrypted, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(encrypted);
                    });
                })
        );
    }

    /**
     * Whether or not the datasource supports bypassing remote fetch operations
     * @returns True if content can be set to bypass fetch operations,
     *  false otherwise
     * @memberof LocalFileDatasource
     */
    supportsRemoteBypass(): boolean {
        return false;
    }
}

registerDatasource("localfile", LocalFileDatasource);
