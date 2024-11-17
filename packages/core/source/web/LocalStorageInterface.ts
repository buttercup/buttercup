import { StorageInterface } from "../storage/StorageInterface.js";

export function getStorage(): Storage {
    return window.localStorage;
}

/**
 * Interface for localStorage
 * @augments StorageInterface
 */
export default class LocalStorageInterface extends StorageInterface {
    _storage: Storage = getStorage();

    get storage() {
        return this._storage;
    }

    /**
     * Get all keys from storage
     * @returns A promise that resolves with an array of keys
     */
    async getAllKeys() {
        return Object.keys(this.storage);
    }

    /**
     * Get the value of a key
     * @param name The key name
     * @returns A promise that resolves with the value
     */
    async getValue(name: string): Promise<string | null> {
        const value = this.storage.getItem(name);
        return value;
    }

    /**
     * Remove a key
     * @param name The key name
     * @returns A promise that resolves when the removal has completed
     */
    async removeKey(name: string): Promise<void> {
        this.storage.removeItem(name);
    }

    /**
     * Set the value for a key
     * @param name The key name
     * @param value The value to set
     * @returns A promise that resolves when the value is set
     */
    async setValue(name: string, value: string): Promise<void> {
        this.storage.setItem(name, value);
    }
}
