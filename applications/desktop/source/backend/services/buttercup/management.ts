import { VaultManager, init } from "@buttercup/core";
import { getVaultCacheStorage, getVaultStorage } from "../storage/index.js";
import { VaultSourceDescription } from "../../types.js";
import { describeSource } from "../../library/vaultSource.js";

let __vaultManager: VaultManager | null = null;

export function getVaultDescriptions(): Array<VaultSourceDescription> {
    const sources = getVaultManager().sources;
    return sources.map(source => describeSource(source)).sort((a, b) => a.order - b.order);
}

export function getVaultManager(): VaultManager {
    if (!__vaultManager) {
        init();
        __vaultManager = new VaultManager({
            cacheStorage: getVaultCacheStorage(),
            sourceStorage: getVaultStorage()
        });
    }
    return __vaultManager;
}
