const BUTTERCUP_FORMAT = "buttercup/a";
const BUTTERCUP_SIGNATURE = "b~>" + BUTTERCUP_FORMAT;

/**
 * Get the current format
 * @returns The format
 */
export function getFormat(): string {
    return BUTTERCUP_FORMAT;
}

/**
 * Get the current signature
 * @returns The signature
 */
export function getSignature(): string {
    return BUTTERCUP_SIGNATURE;
}

/**
 * Detect if a string has a valid signature
 * @param text The text to check
 * @returns True if a valid signature is detected
 */
export function hasValidSignature(text: string): boolean {
    return text.indexOf(BUTTERCUP_SIGNATURE) === 0;
}

/**
 * Sign some text
 * @param text The text to sign
 * @returns The signed text
 */
export function sign(text: string): string {
    return hasValidSignature(text) ? text : BUTTERCUP_SIGNATURE + text;
}

/**
 * Strip the signature from some text
 * @param text The text to strip the signature from
 * @returns The text with the signature removed
 */
export function stripSignature(text: string): string {
    const sigLen = BUTTERCUP_SIGNATURE.length;
    return text.substr(sigLen, text.length - sigLen);
}

/**
 * Check if vault contents are in encrypted form
 * @param contents The vault contents
 * @returns True if encrypted, false otherwise
 */
export function vaultContentsEncrypted(contents: string): boolean {
    if (typeof contents === "string" && hasValidSignature(contents)) {
        const exSig = stripSignature(contents);
        return /["\s\t\n~]/.test(exSig) === false;
    }
    return false;
}
