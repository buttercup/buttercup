/**
 * Generate a UUID
 * @returns A random UUID v4 string
 */
function generateUUID(): string {
    const { v4: uuid } = require("uuid");
    return uuid();
}

export function getRNGResources() {
    return {
        "rng/v1/uuid": generateUUID
    };
}
