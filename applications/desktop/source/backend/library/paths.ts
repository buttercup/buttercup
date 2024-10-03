import path from "node:path";

export function getRootProjectPath(): string {
    // Libary is bundled into ./build/main/index.js, and so is only
    // 2 levels deep, regardless of the source file:
    return path.resolve(__dirname, "../../");
}
