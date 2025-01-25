import { registerHandler } from "../interface.js";
import { IPC } from "../types.js";
import { getVaultDescriptions } from "../../services/buttercup/management.js";

export function registerVaultSourcesHandlers(ipc: IPC) {
    registerHandler(ipc, "get_vaults_list", async function () {
        return getVaultDescriptions();
    });
}
