import { registerHandler } from "../interface.js";
import { IPC } from "../types.js";
import { getConfigValues, setConfigValue } from "../../services/config.js";
import { Config } from "../../types.js";

export function registerConfigHandlers(ipc: IPC) {
    registerHandler(
        ipc,
        "get_config",
        async function () {
            return getConfigValues();
        }
    );

    registerHandler(
        ipc,
        "set_config_value",
        async function <Key extends keyof Config>(key: Key, value: Config[Key]) {
            await setConfigValue(key, value);
            return getConfigValues();
        }
    );
}
