import { VaultSourceID } from "@buttercup/core";
import { useCallback, useMemo } from "react";
import { executeIPCHandler } from "../ipc/handler.js";
import { VaultEditInterface } from "../../shared/vaultEdit/types.js";

export function useVaultEditInterface(
    sourceID: VaultSourceID
): VaultEditInterface {
    const executeCall = useCallback(
        <Method extends keyof VaultEditInterface>(
            method: Method,
            args: Parameters<VaultEditInterface[Method]>
        ) =>
            executeIPCHandler(
                "execute_vault_edit_action",
                sourceID,
                method,
                args
            ),
        [sourceID]
    );

    return useMemo(
        () => ({
            getAllEntryDetails: async () =>
                executeCall("getAllEntryDetails", [])
        }),
        [executeCall]
    );
}
