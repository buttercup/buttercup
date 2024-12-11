import { VaultManager, init } from "@buttercup/core";
import { getVaultCacheStorage, getVaultStorage } from "../storage/index.js";

let __vaultManager: VaultManager | null = null;

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
