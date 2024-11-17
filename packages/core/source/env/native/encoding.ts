/**
 * Convert base64 to text/buffer
 * @returns A decoded string or buffer
 */
function decodeBase64(b64: string, raw: boolean = false): string | Uint8Array {
    const buff = Buffer.from(b64, "base64");
    return raw
        ? new Uint8Array(
              buff.buffer,
              buff.byteOffset,
              buff.byteLength / Uint8Array.BYTES_PER_ELEMENT
          )
        : buff.toString("utf8");
}

/**
 * Convert bytes to base64
 * @returns A base64-encoded string
 */
function encodeBytesToBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes.buffer).toString("base64");
}

/**
 * Convert text to base64
 * @returns A base64-encoded string
 */
function encodeBase64(text: string): string {
    return Buffer.from(text, "utf8").toString("base64");
}

export function getEncodingResources() {
    return {
        "encoding/v1/base64ToBytes": (input: string) => decodeBase64(input, true),
        "encoding/v1/base64ToText": decodeBase64,
        "encoding/v1/bytesToBase64": encodeBytesToBase64,
        "encoding/v1/textToBase64": encodeBase64
    };
}
