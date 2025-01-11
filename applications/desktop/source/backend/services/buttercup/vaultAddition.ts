import {
    Credentials,
    DatasourceConfiguration,
    VaultSource,
    VaultSourceID
} from "@buttercup/core";
import { SourceType } from "../../types.js";
import { getVaultManager } from "./management.js";
import { logInfo } from "../../library/log.js";

export interface AddVaultPayload {
    createNew: boolean;
    datasourceConfig: DatasourceConfiguration;
    masterPassword: string;
    name: string;
}

async function addVault(
    name: string,
    sourceCredentials: Credentials,
    passCredentials: Credentials,
    type: SourceType,
    createNew: boolean = false
): Promise<VaultSourceID> {
    const credsSecure = await sourceCredentials.toSecureString();
    const vaultManager = getVaultManager();
    const source = new VaultSource(name, type, credsSecure);
    await vaultManager.interruptAutoUpdate(async () => {
        await vaultManager.addSource(source);
        try {
            await source.unlock(passCredentials, {
                initialiseRemote: createNew
            });
            await vaultManager.dehydrateSource(source);
        } catch (err) {
            await vaultManager.removeSource(source.id);
            throw err;
        }
    });
    return source.id;
}

export async function addVaultFromPayload(
    payload: AddVaultPayload
): Promise<VaultSourceID> {
    let credentials: Credentials;
    switch (payload.datasourceConfig.type) {
        case SourceType.GoogleDrive:
            credentials = Credentials.fromDatasource(
                payload.datasourceConfig,
                payload.masterPassword
            );
            break;
        case SourceType.Dropbox:
        /* falls-through */
        case SourceType.WebDAV:
        /* falls-through */
        case SourceType.File: {
            credentials = Credentials.fromDatasource(
                payload.datasourceConfig,
                payload.masterPassword
            );
            break;
        }
        default:
            throw new Error(
                `Unsupported vault type: ${payload.datasourceConfig.type}`
            );
    }
    logInfo(
        `Adding vault "${payload.name}" (${payload.datasourceConfig.type}) (new = ${
            payload.createNew ? "yes" : "no"
        })`
    );
    const sourceID = await addVault(
        payload.name,
        credentials,
        Credentials.fromPassword(payload.masterPassword),
        payload.datasourceConfig.type,
        payload.createNew
    );
    logInfo(`Added vault "${payload.name}" (${sourceID})`);
    return sourceID;
}
