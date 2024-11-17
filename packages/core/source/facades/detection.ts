const OTPURI_PATTERN = /^otpauth:\/\/[ht]otp\/[^\s]+$/i;

/**
 * Check if a string is an OTP URI
 * @param str The string to check
 * @memberof module:Buttercup
 */
export function isOTPURI(str: string): boolean {
    return OTPURI_PATTERN.test(str);
}

/**
 * Check if an object is a vault facade
 * @param obj The item to check
 * @returns True if a vault facade
 * @memberof module:Buttercup
 */
export function isVaultFacade(obj: any): boolean {
    if (!obj || typeof obj !== "object") {
        return false;
    }
    return (
        obj.type === "vault" &&
        typeof obj.id === "string" &&
        Array.isArray(obj.entries) &&
        Array.isArray(obj.groups)
    );
}
