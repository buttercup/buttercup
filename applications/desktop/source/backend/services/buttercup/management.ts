import { VaultManager, init } from "@buttercup/core";
import { getVaultCacheStorage, getVaultStorage } from "../storage/index.js";
import { VaultSourceDescription } from "../../types.js";
import { describeSource } from "../../library/vaultSource.js";

let __vaultManager: VaultManager | null = null;

export function getVaultDescriptions(): Array<VaultSourceDescription> {
    const sources = getVaultManager().sources;
    return sources
        .map((source) => describeSource(source))
        .sort((a, b) => a.order - b.order);
}

export function getVaultManager(): VaultManager {
    if (!__vaultManager) {
        throw new Error("Vault manager not initialised");
    }
    return __vaultManager;
}

export async function initialise() {
    init();

    if (__vaultManager) {
        throw new Error("Vault manager already initialised");
    }

    __vaultManager = new VaultManager({
        cacheStorage: getVaultCacheStorage(),
        sourceStorage: getVaultStorage()
    });
    await __vaultManager.rehydrate();
}
