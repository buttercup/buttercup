import { serialiseLogItems } from "../../shared/library/log.js";
import { LogLevel } from "../../shared/types.js";
import { executeIPCHandler } from "../ipc/handler.js";

export function logErr(...items: Array<any>) {
    executeIPCHandler(
        "emit_frontend_log",
        LogLevel.Error,
        serialiseLogItems(["(front-end)", ...items])
    ).catch((err) => {
        console.error("Failed emitting error log", err);
    });
}

export function logInfo(...items: Array<any>) {
    executeIPCHandler(
        "emit_frontend_log",
        LogLevel.Info,
        serialiseLogItems(["(front-end)", ...items])
    ).catch((err) => {
        console.error("Failed emitting log", err);
    });
}

export function logWarn(...items: Array<any>) {
    executeIPCHandler(
        "emit_frontend_log",
        LogLevel.Warning,
        serialiseLogItems(["(front-end)", ...items])
    ).catch((err) => {
        console.error("Failed emitting warning", err);
    });
}
