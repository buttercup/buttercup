import pako from "pako";

const { gzip, ungzip } = pako;

/**
 * Compress text using GZIP
 * @param text The text to compress
 * @returns Compressed text
 */
function compress(text: string): string {
    return gzip(text, {
        level: 9,
        to: "string"
    });
}

/**
 * Decompress a compressed string (GZIP)
 * @param text The compressed text
 * @returns Decompressed text
 */
function decompress(text: string): string {
    return ungzip(text, { to: "string" });
}

export function getCompressionResources() {
    return {
        "compression/v1/compressText": compress,
        "compression/v1/decompressText": decompress
    };
}
