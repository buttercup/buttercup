export function isValidTag(tag: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(tag);
}
