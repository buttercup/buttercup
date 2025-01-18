import { useCallback, useEffect, useMemo, useState } from "react";
import { Config } from "../../shared/types.js";
import { useIPCCall } from "./ipc.js";

export function useConfig(): {
    config: Config | null;
    setConfigValue: <Key extends keyof Config>(key: Key, value: Config[Key]) => void;
} {
    const { execute: executeGetConfig, result: getResult } = useIPCCall("get_config");
    const { execute: executeSetConfigValue, result: setResult } = useIPCCall("set_config_value");

    const [lastConfig, setLastConfig] = useState<Config | null>(null);

    useEffect(() => {
        executeGetConfig();
    }, [executeGetConfig]);

    const setConfigValue = useCallback(<Key extends keyof Config>(key: Key, value: Config[Key]) => {
        executeSetConfigValue(key, value);
    }, [executeSetConfigValue]);

    useEffect(() => {
        if (getResult !== null) {
            setLastConfig(getResult);
        }
    }, [getResult]);
    useEffect(() => {
        if (setResult !== null) {
            setLastConfig(setResult);
        }
    }, [setResult]);

    return useMemo(() => ({ config: lastConfig, setConfigValue }), [ lastConfig, setConfigValue ]);
}
