import { getEnvironment } from "./environment.js";

export function getPortableExeDir(): string {
    const portableExeDir = getEnvironment().portableExecutableDirectory;
    if (!portableExeDir) {
        throw new Error("No portable executable directory specified");
    }
    return portableExeDir;
}

export function isPortable(): boolean {
    return !!getEnvironment().portableExecutableAppFilename;
}
