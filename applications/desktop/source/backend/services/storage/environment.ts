import { mkdir } from "fs/promises";
import { EnvPaths } from "./index.js";

export async function ensureEnvironmentDirectories(
    envPaths: EnvPaths
): Promise<void> {
    const paths = Object.values(envPaths).filter(
        (value) => typeof value === "string"
    );
    for (const path of paths) {
        await mkdir(path, { recursive: true });
    }
}
