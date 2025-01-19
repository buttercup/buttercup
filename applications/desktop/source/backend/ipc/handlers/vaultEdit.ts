import { VaultSourceID } from "@buttercup/core";
import { registerHandler } from "../interface.js";
import { VaultEditInterface } from "../../../shared/vaultEdit/types.js";
import { getAllEntryDetails, getAllGroups, getEntry, getGroupEntryDetails } from "../../services/buttercup/vaultEdit.js";
import { IPC } from "../types.js";

export function registerVaultEditHandlers(ipc: IPC) {
    registerHandler(ipc, "execute_vault_edit_action", async function <
        Method extends keyof VaultEditInterface
    >(sourceID: VaultSourceID, methodName: Method, args: Parameters<VaultEditInterface[Method]>): Promise<
        ReturnType<VaultEditInterface[Method]>
    > {
        switch (methodName) {
            case "getAllEntryDetails":
                return getAllEntryDetails(sourceID) as ReturnType<
                    VaultEditInterface[Method]
                >;

            case "getAllGroups":
                return getAllGroups(sourceID) as ReturnType<VaultEditInterface[Method]>;

            case "getEntry": {
                const [entryID] = args as Parameters<VaultEditInterface["getEntry"]>;
                return getEntry(sourceID, entryID) as ReturnType<
                    VaultEditInterface[Method]
                >;
            }

            case "getGroupEntryDetails": {
                const [groupID] = args as Parameters<VaultEditInterface["getGroupEntryDetails"]>;
                return getGroupEntryDetails(sourceID, groupID) as ReturnType<
                    VaultEditInterface[Method]
                >;
            }

            default:
                throw new Error(
                    `Unsupported vault edit command: ${methodName}`
                );
        }
    });
}
