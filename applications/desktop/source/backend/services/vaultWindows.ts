import { BrowserWindow } from "electron"
import { VaultSourceID } from "@buttercup/core";
import { VaultState } from "../types.js";

interface VaultWindow {
    sourceID: VaultSourceID | null;
    state: VaultState;
    window: BrowserWindow;
}

const __windows: Array<VaultWindow> = [];

function getVaultWindowForWindow(win: BrowserWindow): VaultWindow {
    initialiseBrowserWindow(win);

    const target = __windows.find(item => item.window.id === win.id);
    if (!target) {
        throw new Error(`Failed fetching vault window config for browser window: ${win.id}`);
    }

    return target;
}

export function getVaultWindowState(win: BrowserWindow): VaultState {
    const vaultWindow = getVaultWindowForWindow(win);

    return structuredClone(vaultWindow.state);
}

function initialiseBrowserWindow(win: BrowserWindow): void {
    const existing = __windows.find(item => item.window.id === win.id);
    if (existing) return;

    const newWindow: VaultWindow = {
        sourceID: null,
        state: {
            source: "idle"
        },
        window: win
    };
    __windows.push(newWindow);
}

export function setVaultWindowSourceID(win: BrowserWindow, sourceID: VaultSourceID): void {
    initialiseBrowserWindow(win);

    const target = __windows.find(item => item.window.id === win.id);
    if (!target) {
        throw new Error(`Failed fetching vault window config for browser window: ${win.id}`);
    }

    target.sourceID = sourceID;
}
