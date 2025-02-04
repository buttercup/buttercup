import { VaultManager, VaultSourceID, init } from "@buttercup/core";
import { getVaultCacheStorage, getVaultStorage } from "../storage/index.js";
import { VaultSourceDescription } from "../../types.js";
import { describeSource } from "../../library/vaultSource.js";
import { setVaultWindowStateBySource } from "../vaultWindows.js";
import { logInfo } from "../../library/log.js";

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
        autoUpdate: true,
        autoUpdateDelay: 30000,
        cacheStorage: getVaultCacheStorage(),
        sourceStorage: getVaultStorage()
    });
    __vaultManager.initialise();
    await __vaultManager.rehydrate();

    const listenerMap: Record<VaultSourceID, Record<string, () => void>> = {};

    __vaultManager.on("autoUpdateStart", () => {
        logInfo("Auto update started");
    });
    __vaultManager.on("autoUpdateStop", () => {
        logInfo("Auto update complete");
    });

    __vaultManager.on("sourcesUpdated", () => {
        logInfo("Vault sources updated");
        for (const source of (__vaultManager as VaultManager).sources) {
            const listenerBatch = listenerMap[source.id];
            if (listenerBatch) {
                for (const eventName in listenerBatch) {
                    source.off(eventName, listenerBatch[eventName]);
                }
            }
            listenerMap[source.id] = {};

            const handleChangeStart = () => {
                console.log("START");
                setVaultWindowStateBySource(source.id, "saving");
            };
            const handleChangeStop = () => {
                console.log("STOP");
                setVaultWindowStateBySource(source.id, "idle");
            };

            source.on("state-change-start", handleChangeStart);
            source.on("state-change-stop", handleChangeStop);

            listenerMap[source.id]["state-change-start"] = handleChangeStart;
            listenerMap[source.id]["state-change-stop"] = handleChangeStop;
        }
    });
}
