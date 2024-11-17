import zlib from "zlib";

/**
 * Compress text using GZIP
 * @param text The text to compress
 * @returns Compressed text (base64)
 */
async function compress(text: string): Promise<string> {
    const buff = Buffer.from(text, "utf8");
    const compressed: Buffer = await new Promise((resolve, reject) => {
        zlib.gzip(buff, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
    return compressed.toString("base64");
}

/**
 * Decompress a compressed string (GZIP, base64)
 * @param text The compressed text
 * @returns Decompressed text
 */
async function decompress(text: string): Promise<string> {
    const compressedData = Buffer.from(text, "base64");
    const decompressedData: Buffer = await new Promise((resolve, reject) => {
        zlib.gunzip(compressedData, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
    return decompressedData.toString("utf8");
}

export function getCompressionResources() {
    return {
        "compression/v2/compressText": compress,
        "compression/v2/decompressText": decompress
    };
}
