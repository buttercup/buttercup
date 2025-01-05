import { Credentials, VaultSourceID } from "@buttercup/core";
import { getVaultManager } from "./management.js";

export async function lockVaultSource(sourceID: VaultSourceID): Promise<void> {
    const vaultMgr = getVaultManager();

    const source = vaultMgr.getSourceForID(sourceID);
    if (!source) {
        throw new Error(`No vault source found for ID: ${sourceID}`);
    }

    await source.lock();
}


export async function unlockVaultSource(sourceID: VaultSourceID, password: string): Promise<void> {
    const vaultMgr = getVaultManager();

    const source = vaultMgr.getSourceForID(sourceID);
    if (!source) {
        throw new Error(`No vault source found for ID: ${sourceID}`);
    }

    await source.unlock(Credentials.fromPassword(password));
}
