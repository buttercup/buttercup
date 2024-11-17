import { v4 as uuid } from "uuid";

/**
 * Generate a UUID
 * @returns A random UUID v4 string
 */
function generateUUID(): string {
    return uuid();
}

export function getRNGResources() {
    return {
        "rng/v1/uuid": generateUUID
    };
}
