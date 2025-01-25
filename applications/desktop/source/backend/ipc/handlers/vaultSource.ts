import { VaultSourceID } from "@buttercup/core";
import { registerHandler } from "../interface.js";
import { IPC } from "../types.js";
import { getVaultWindowState, setVaultWindowSourceID } from "../../services/vaultWindows.js";

export function registerVaultSourceHandlers(ipc: IPC) {
    registerHandler(ipc, "enter_vault", async function(sourceID: VaultSourceID) {
        if (!this.callerWindow) {
            throw new Error("No window for enter_vault call");
        }

        setVaultWindowSourceID(this.callerWindow, sourceID);
    });

    registerHandler(ipc, "get_vault_window_state", async function() {
        if (!this.callerWindow) {
            throw new Error("No window for enter_vault call");
        }

        return getVaultWindowState(this.callerWindow);
    });
}
