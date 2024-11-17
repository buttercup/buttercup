const __store: Record<string, string | null> = {};

export function getMasterPassword(id: string): string | null {
    return __store[id] || null;
}

export function removeMasterPassword(id: string) {
    __store[id] = null;
    delete __store[id];
}

export function setMasterPassword(id: string, value: string) {
    __store[id] = value;
}
