import { ipcMain } from "electron";
import { registerLocalFileDatasourceHandlers } from "./handlers/localFileDatasource.js";
import { registerVaultSourcesHandlers } from "./handlers/vaultSources.js";
import { registerLockUnlockHandlers } from "./handlers/vaultLockUnlock.js";
import { registerVaultEditHandlers } from "./handlers/vaultEdit.js";
import { registerLogHandlers } from "./handlers/logs.js";
import { registerConfigHandlers } from "./handlers/config.js";
import { registerVaultSourceHandlers } from "./handlers/vaultSource.js";

export function initialise() {
    const ipc = ipcMain;

    registerLocalFileDatasourceHandlers(ipc);
    registerVaultSourcesHandlers(ipc);
    registerVaultSourceHandlers(ipc);
    registerLockUnlockHandlers(ipc);
    registerVaultEditHandlers(ipc);
    registerLogHandlers(ipc);
    registerConfigHandlers(ipc);
}
