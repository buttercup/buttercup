import * as base64 from "base64-js";

/**
 * Convert base64 to text/byte-array
 * @returns A decoded string or array of bytes
 */
function decodeBase64(b64: string, raw: boolean = false): string | Uint8Array {
    return raw ? base64.toByteArray(b64) : new TextDecoder().decode(base64.toByteArray(b64));
}

/**
 * Convert bytes to base64
 * @returns A base64-encoded string
 */
function encodeBytesToBase64(bytes: Uint8Array): string {
    return base64.fromByteArray(bytes);
}

/**
 * Convert text to base64
 * @returns A base64-encoded string
 */
function encodeTextToBase64(text: string): string {
    return encodeBytesToBase64(new TextEncoder().encode(text));
}

export function getEncodingResources() {
    return {
        "encoding/v1/base64ToBytes": (input: string) => decodeBase64(input, true),
        "encoding/v1/base64ToText": decodeBase64,
        "encoding/v1/bytesToBase64": encodeBytesToBase64,
        "encoding/v1/textToBase64": encodeTextToBase64
    };
}
