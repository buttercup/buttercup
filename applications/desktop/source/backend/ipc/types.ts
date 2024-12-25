import { BrowserWindow, type IpcMain } from "electron";

export type IPC = IpcMain;

export interface IPCHandlerContext {
    callerWindow: BrowserWindow | null;
}
