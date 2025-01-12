import { EntryID, VaultSourceID } from "@buttercup/core";
import { useCallback, useMemo } from "react";
import { executeIPCHandler } from "../ipc/handler.js";
import { VaultEditInterface } from "../../shared/vaultEdit/types.js";

export function useVaultEditInterface(
    sourceID: VaultSourceID
): VaultEditInterface {
    const executeCall = useCallback(
        async <Method extends keyof VaultEditInterface>(
            method: Method,
            args: Parameters<VaultEditInterface[Method]>
        ): Promise<ReturnType<VaultEditInterface[Method]>> => {
            const result = await executeIPCHandler(
                "execute_vault_edit_action",
                sourceID,
                method,
                args
            );
            return result as ReturnType<VaultEditInterface[Method]>;
        },
        [sourceID]
    );

    return useMemo(
        () => ({
            getAllEntryDetails: async () =>
                executeCall("getAllEntryDetails", []),
            getEntry: async (entryID: EntryID) => executeCall("getEntry", [entryID])
        }),
        [executeCall]
    );
}
