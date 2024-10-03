export function isOSX() {
    return process.platform === "darwin";
}

export function isWindows() {
    return process.platform === "win32";
}

export function isLinux() {
    return process.platform === "linux";
}
