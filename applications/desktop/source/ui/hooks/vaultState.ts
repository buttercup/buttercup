import { useEffect, useState } from "react";
import { VaultState } from "../../shared/types.js";
import { useRepeatingIPCCall } from "./ipc.js";
import { naiveDeepEqual } from "../../shared/library/equality.js";

const VAULT_STATE_UPDATE = 5000;

function getDefaultState(): VaultState {
    return {
        source: "idle"
    };
}

export function useVaultState(): VaultState {
    const [lastState, setLastState] = useState<VaultState>(getDefaultState);

    const { result } = useRepeatingIPCCall("get_vault_window_state", [], VAULT_STATE_UPDATE);
    useEffect(() => {
        if (result !== null && naiveDeepEqual(lastState, result) === false) {
            setLastState(structuredClone(result));
        }
    }, [lastState, result]);

    return lastState;
}
