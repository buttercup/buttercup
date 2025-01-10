import { VaultSourceID } from "@buttercup/core";
import { registerHandler } from "../interface.js";
import { VaultEditInterface } from "../../../shared/vaultEdit/types.js";
import { getAllEntryDetails } from "../../services/buttercup/vaultEdit.js";
import { IPC } from "../types.js";

export function registerVaultEditHandlers(ipc: IPC) {
    registerHandler(ipc, "execute_vault_edit_action", async function<Method extends keyof VaultEditInterface>(
        sourceID: VaultSourceID,
        methodName: Method,
        args: Parameters<VaultEditInterface[Method]>
    ): Promise<ReturnType<VaultEditInterface[Method]>> {
        switch (methodName) {
            case "getAllEntryDetails":
                return getAllEntryDetails(sourceID) as ReturnType<VaultEditInterface[Method]>;

            default:
                throw new Error(`Unsupported vault edit command: ${methodName}`);
        }
    });
}

