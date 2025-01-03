import { ipcMain } from "electron";
import { registerLocalFileDatasourceHandlers } from "./handlers/localFileDatasource.js";
import { registerVaultSourceHandlers } from "./handlers/vaultSources.js";

export function initialise() {
    const ipc = ipcMain;

    registerLocalFileDatasourceHandlers(ipc);
    registerVaultSourceHandlers(ipc);
}
