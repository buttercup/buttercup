import { gzip, ungzip } from "pako";
import { base64ToBytes, bytesToBase64 } from "../../tools/encoding.js";

/**
 * Compress text using GZIP
 * @param text The text to compress
 * @returns Compressed text
 */
async function compress(text: string): Promise<string> {
    return Promise.resolve().then(() => {
        const output = gzip(text, {
            level: 9
        });
        return bytesToBase64(output);
    });
}

/**
 * Decompress a compressed string (GZIP)
 * @param text The compressed text
 * @returns Decompressed text
 */
async function decompress(text: string): Promise<string> {
    return Promise.resolve().then(() => {
        return ungzip(base64ToBytes(text), { to: "string" });
    });
}

export function getCompressionResources() {
    return {
        "compression/v2/compressText": compress,
        "compression/v2/decompressText": decompress
    };
}
