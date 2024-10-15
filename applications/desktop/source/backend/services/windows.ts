import path from "node:path";
import { BrowserWindow, BrowserWindowConstructorOptions, app, shell } from "electron";
import { isLinux, isWindows } from "../library/platform.js";
import { getRootProjectPath } from "../library/paths.js";

const __vaultWindows: Array<BrowserWindow> = [];

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

export async function focusLastWindowOrOpenNew(): Promise<BrowserWindow> {
    if (__vaultWindows.length > 0) {
        const last = __vaultWindows[__vaultWindows.length - 1];
        if (!last.isVisible()) {
            last.show();
            last.focus();
        }
        return last;
    }

    return openNewVaultWindow();
}

export async function openNewVaultWindow(): Promise<BrowserWindow> {
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
    const win = new BrowserWindow(config);

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
    win.loadFile(path.join(root, "dist/ui/index.html"));
    await loadedPromise;

    // win.center();
    // win.show();
    // win.setAlwaysOnTop(true);
    // win.show();
    // win.setAlwaysOnTop(false);
    // app.focus();

    // win.show();
    // setTimeout(() => {
    //     win.moveTop();
    // }, 1);

    win.show();
    app.focus();

    __vaultWindows.push(win);

    return win;
}
