import path from "node:path";
import { BrowserWindow, BrowserWindowConstructorOptions, shell } from "electron";
import { isLinux, isWindows } from "../library/platform.js";
import { getRootProjectPath } from "../library/paths.js";

let __menuWindow: BrowserWindow | null = null;

export async function closeWindows(): Promise<void> {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win) => {
        win.close();
    });
}

function getIconPath(): string {
    const trayPath = isWindows() ? "tray.ico" : isLinux() ? "tray-linux.png" : "trayTemplate.png";
    const root = getRootProjectPath();
    return path.join(root, "resources/icons", trayPath);
}

export async function openMenuWindow(): Promise<BrowserWindow> {
    if (!__menuWindow) {
        const config: BrowserWindowConstructorOptions = {
            width: 300,
            height: 420,
            icon: getIconPath(),
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true,
                spellcheck: false
            }
        };
        const win = __menuWindow = new BrowserWindow(config);

        win.webContents.setWindowOpenHandler((details) => {
            // logInfo(`Request to open external URL: ${details.url}`);
            shell.openExternal(details.url);
            return { action: "deny" };
        });

        const loadedPromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(
                () => reject(new Error("Timed-out waiting for window to load")),
                10000
            );
            win.webContents.once("did-finish-load", () => {
                clearTimeout(timeout);
                resolve();
            });
        });
        const root = getRootProjectPath();
        win.loadFile(path.join(root, "build/renderer/index.html"));
        await loadedPromise;
    }

    if (!__menuWindow.isVisible()) {
        __menuWindow.show();
        __menuWindow.focus();
    }

    return __menuWindow;
}
