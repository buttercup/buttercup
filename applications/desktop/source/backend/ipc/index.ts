import { ipcMain } from "electron";
import { registerLocalFileDatasourceHandlers } from "./handlers/localFileDatasource.js";

export function initialise() {
    const ipc = ipcMain;

    registerLocalFileDatasourceHandlers(ipc);
}
