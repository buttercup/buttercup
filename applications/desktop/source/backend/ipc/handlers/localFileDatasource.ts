import { dialog, type BrowserWindow } from "electron";
import { registerHandler } from "../interface.js";
import { IPC } from "../types.js";

async function showExistingVaultFileDialog(win: BrowserWindow): Promise<string | null> {
    const result = await dialog.showOpenDialog(win, {
        title: "Choose existing vault file",
        buttonLabel: "Choose",
        filters: [{ name: "Buttercup Vaults", extensions: ["bcup"] }],
        properties: ["openFile"]
        // title: t("dialog.file-vault.add-new.title"),
        // buttonLabel: t("dialog.file-vault.add-new.confirm-button"),
        // filters: [{ name: t("dialog.file-vault.add-new.bcup-filter"), extensions: ["bcup"] }],
        // properties: ["createDirectory", "dontAddToRecent", "showOverwriteConfirmation"]
    });
    const [vaultPath] = result.filePaths;
    return vaultPath || null;
}

export function registerLocalFileDatasourceHandlers(ipc: IPC) {
    registerHandler(ipc, "local_file_browse_existing", async function() {
        if (!this.callerWindow) {
            throw new Error("No available browser window");
        }

        const chosenPath = await showExistingVaultFileDialog(this.callerWindow);
        return { filePath: chosenPath };
    });
}
