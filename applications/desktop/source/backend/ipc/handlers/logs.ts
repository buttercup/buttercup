import { registerHandler } from "../interface.js";
import { logErr, logInfo, logWarn } from "../../library/log.js";
import { LogLevel } from "../../types.js";
import { IPC } from "../types.js";

export function registerLogHandlers(ipc: IPC) {
    registerHandler(
        ipc,
        "emit_frontend_log",
        async function (level: LogLevel, message: string) {
            switch (level) {
                case LogLevel.Error:
                    logErr("[FrontEnd]", message);
                    break;
                case LogLevel.Info:
                    logInfo("[FrontEnd]", message);
                    break;
                case LogLevel.Warning:
                    logWarn("[FrontEnd]", message);
                    break;
                default:
                    throw new Error(`Unexpected log level: ${level}`);
            }
        }
    );
}
