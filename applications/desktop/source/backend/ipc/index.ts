import { ipcMain } from "electron";
import { registerLocalFileDatasourceHandlers } from "./handlers/localFileDatasource.js";
import { registerVaultSourceHandlers } from "./handlers/vaultSources.js";
import { registerLockUnlockHandlers } from "./handlers/vaultLockUnlock.js";
import { registerVaultEditHandlers } from "./handlers/vaultEdit.js";

export function initialise() {
    const ipc = ipcMain;

    registerLocalFileDatasourceHandlers(ipc);
    registerVaultSourceHandlers(ipc);
    registerLockUnlockHandlers(ipc);
    registerVaultEditHandlers(ipc);
}
