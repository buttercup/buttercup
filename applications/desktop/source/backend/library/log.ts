import debounce from "debounce";
import { ChannelQueue } from "@buttercup/channel-queue";
import { writeLines } from "../services/logging.js";
import { serialiseLogItems } from "../../shared/library/log.js";
import { LogLevel } from "../types.js";

const WRITE_FREQUENCY = 2.5 * 1000;

const __lines: Array<string> = [];
let __queue: ChannelQueue;
let __write: () => Promise<void>;

function generateLogPrefix(level: LogLevel): string {
    const date = new Date();
    let levelPrefix: string;
    switch (level) {
        case LogLevel.Error:
            levelPrefix = "ERR";
            break;
        case LogLevel.Info:
            levelPrefix = "INF";
            break;
        case LogLevel.Warning:
            levelPrefix = "WAR";
            break;
        default:
            throw new Error(`Invalid log level: ${level}`);
    }
    const [hours, minutes, seconds] = [
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
    ].map((val) => {
        const str = `${val}`;
        return str.length === 2 ? str : `0${str}`;
    });
    return `[${levelPrefix}] ${hours}:${minutes}:${seconds}:`;
}

export function log(level: LogLevel, items: Array<any>) {
    const serialised = serialiseLogItems(items);
    const logLine = `${generateLogPrefix(level)} ${serialised}`;
    console.log(logLine);
    __lines.push(logLine);
    if (!__write) {
        const debouncedFn = debounce(write, WRITE_FREQUENCY, {
            immediate: false
        });
        if (!debouncedFn) {
            throw new Error("Failed debouncing log writer");
        }
        __write = debouncedFn as () => Promise<void>;
    }
    __write();
}

export function logErr(...items: Array<any>) {
    return log(LogLevel.Error, items);
}

export function logInfo(...items: Array<any>) {
    return log(LogLevel.Info, items);
}

export function logWarn(...items: Array<any>) {
    return log(LogLevel.Warning, items);
}

async function write() {
    if (!__queue) {
        __queue = new ChannelQueue();
    }
    await __queue.channel("write").enqueue(
        async () => {
            const toWrite = [...__lines];
            __lines.splice(0, Infinity);
            if (toWrite.length === 0) return;
            await writeLines(toWrite);
        },
        undefined,
        "write-stack"
    );
}
