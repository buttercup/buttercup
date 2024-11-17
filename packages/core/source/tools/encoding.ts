import { generateUUID } from "./uuid.js";
import { getSharedAppEnv } from "../env/appEnv.js";

const ENCODED_STRING_PATTERN = /^utf8\+base64:(|[a-zA-Z0-9+\/=]+)$/;
export const ENCODED_STRING_PREFIX = "utf8+base64:";

/**
 * Decode a base64 string to a typed array
 * @param b64 The base64 string
 * @returns A typed array
 */
export function base64ToBytes(b64: string): Uint8Array {
    const decode = getSharedAppEnv().getProperty("encoding/v1/base64ToBytes");
    return decode(b64);
}

/**
 * Encode a typed array to base64
 * @param uint8Arr The array of bytes to encode
 * @returns A base64 encoded string
 */
export function bytesToBase64(uint8Arr: Uint8Array): string {
    const encode = getSharedAppEnv().getProperty("encoding/v1/bytesToBase64");
    return encode(uint8Arr);
}

/**
 * Decode a base64 string
 * @param b64 The base64 string
 * @returns The decoded string
 */
export function decodeBase64String(b64: string): string {
    const decode = getSharedAppEnv().getProperty("encoding/v1/base64ToText");
    return decode(b64);
}

/**
 * Decode an encoded property value
 * @param value The encoded value
 * @returns The decoded value
 */
export function decodeStringValue(value: string): string {
    if (isEncoded(value) !== true) {
        throw new Error("Cannot decode: provided value is not encoded");
    }
    const newValue = value.substr(ENCODED_STRING_PREFIX.length);
    const decode = getSharedAppEnv().getProperty("encoding/v1/base64ToText");
    return decode(newValue);
}

/**
 * Encode a base64 string
 * @param text The raw text to encode
 * @returns A base64 encoded string
 */
export function encodeBase64String(text: string): string {
    const encode = getSharedAppEnv().getProperty("encoding/v1/textToBase64");
    return encode(text);
}

/**
 * Encode a raw value into safe storage form
 * Uses base64 for encoding
 * @param value The raw value to encode
 * @returns The encoded result
 */
export function encodeStringValue(value: string): string {
    const encode = getSharedAppEnv().getProperty("encoding/v1/textToBase64");
    return `${ENCODED_STRING_PREFIX}${encode(value)}`;
}

/**
 * Get a unique identifier (UUID v4)
 * @returns A unique identifier
 */
export function getUniqueID(): string {
    return generateUUID();
}

/**
 * Check if a string value is encoded
 * @param text The value to check
 * @returns True if the text is encoded
 */
export function isEncoded(text: string): boolean {
    return ENCODED_STRING_PATTERN.test(text);
}
