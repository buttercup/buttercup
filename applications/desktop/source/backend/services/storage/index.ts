import path from "node:path";
import envPaths from "env-paths";
import { VaultSourceID } from "@buttercup/core";
import { FileStorage } from "./FileStorage.js";
import { Environment } from "../../library/environment.js";
import { ensureEnvironmentDirectories } from "./environment.js";
import { logInfo } from "../../library/log.js";

export interface EnvPaths {
    data: string;
    config: string;
    cache: string;
    log: string;
    temp: string;
}

let __envPaths: EnvPaths | null = null;

// const CONFIG_PATH = path.join(__envPaths.config, "desktop.config.json");
export const LOG_FILENAME = "buttercup-desktop.log";
// export const LOG_PATH = path.join(__envPaths.log, LOG_FILENAME);
// export const VAULTS_BACKUP_PATH = path.join(__envPaths.data, "backup");
// const VAULTS_CACHE_PATH = path.join(__envPaths.temp, "vaults-offline.cache.json");
// const VAULTS_PATH = path.join(__envPaths.data, "vaults.json");
// const VAULT_SETTINGS_PATH = path.join(__envPaths.config, "vault-config-SOURCEID.json");

let __configStorage: FileStorage | null = null,
    __vaultStorage: FileStorage | null = null,
    __vaultCacheStorage: FileStorage | null = null;

export function getConfigPath(): string {
    if (!__envPaths) {
        throw new Error("Storage/configuration not initialised");
    }
    return path.join(__envPaths.config, "desktop.config.json");
}

export function getConfigStorage(): FileStorage {
    if (!__configStorage) {
        const configPath = getConfigPath();
        __configStorage = new FileStorage(configPath);
    }
    return __configStorage;
}

export function getLogPath(): string {
    if (!__envPaths) {
        throw new Error("Storage/configuration not initialised");
    }
    return path.join(__envPaths.log, LOG_FILENAME);
}

function getVaultCachePath(): string {
    if (!__envPaths) {
        throw new Error("Storage/configuration not initialised");
    }
    return path.join(__envPaths.temp, "vaults-offline.cache.json");
}

export function getVaultCacheStorage(): FileStorage {
    if (!__vaultCacheStorage) {
        const cachePath = getVaultCachePath();
        __vaultCacheStorage = new FileStorage(cachePath);
    }
    return __vaultCacheStorage;
}

export function getVaultSettingsPath(sourceID: VaultSourceID): string {
    if (!__envPaths) {
        throw new Error("Storage/configuration not initialised");
    }
    return path
        .join(__envPaths.config, "vault-config-SOURCEID.json")
        .replace("SOURCEID", sourceID);
}

export function getVaultSettingsStorage(sourceID: VaultSourceID): FileStorage {
    return new FileStorage(getVaultSettingsPath(sourceID));
}

export function getVaultStorage(): FileStorage {
    if (!__vaultStorage) {
        const vaultsPath = getVaultStoragePath();
        logInfo(`Preparing vault storage: ${vaultsPath}`);

        __vaultStorage = new FileStorage(vaultsPath);
    }
    return __vaultStorage;
}

export function getVaultStoragePath(): string {
    if (!__envPaths) {
        throw new Error("Storage/configuration not initialised");
    }
    return path.join(__envPaths.data, "vaults.json");
}

export async function initialise(environment: Environment): Promise<void> {
    if (environment.buttercupHomeDir) {
        __envPaths = {
            data: path.join(environment.buttercupHomeDir, "data"),
            config: path.join(
                environment.buttercupConfigDir || environment.buttercupHomeDir,
                "config"
            ),
            cache: path.join(environment.buttercupHomeDir, "cache"),
            log: path.join(environment.buttercupHomeDir, "log"),
            temp: path.join(
                environment.buttercupTempDir || environment.buttercupHomeDir,
                "temp"
            )
        };
    } else {
        const TEMP_ENV_PATHS = envPaths("buttercup-desktop-v3");
        __envPaths = {
            data: TEMP_ENV_PATHS.data,
            config: TEMP_ENV_PATHS.config,
            cache: TEMP_ENV_PATHS.cache,
            log: TEMP_ENV_PATHS.log,
            temp: TEMP_ENV_PATHS.temp
        };
    }

    // Try creating paths
    await ensureEnvironmentDirectories(__envPaths);
}
