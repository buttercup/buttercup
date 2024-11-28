import fs from "node:fs/promises";
import path from "node:path";
import rotate from "log-rotate";
import { LOG_FILENAME, getLogPath as _getLogPath } from "./storage/index.js";
import { getPortableExeDir, isPortable } from "../library/portability.js";

const LOG_RETENTION = 10;

export function getLogPath(): string {
    return isPortable() ? path.join(getPortableExeDir(), LOG_FILENAME) : _getLogPath();
}

export async function initialise() {
    const logPath = getLogPath();
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await new Promise<void>((resolve, reject) => {
        rotate(logPath, { count: LOG_RETENTION, compress: false }, (error) => {
            if (error) return reject(error);
            resolve();
        });
    });
}

export async function writeLines(lines: Array<string>): Promise<void> {
    const logPath = getLogPath();
    await fs.appendFile(logPath, `${lines.join("\n")}\n`);
}
