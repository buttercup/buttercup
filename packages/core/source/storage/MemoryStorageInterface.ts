import { StorageInterface } from "./StorageInterface.js";

/**
 * Storage interface for memory storage
 * @augments StorageInterface
 * @memberof module:Buttercup
 */
export class MemoryStorageInterface extends StorageInterface {
    _store: { [property: string]: string } = {};

    /**
     * Get all keys from storage
     * @returns A promise that resolves with an array of keys
     * @memberof MemoryStorageInterface
     */
    getAllKeys(): Promise<Array<string>> {
        return Promise.resolve(Object.keys(this._store));
    }

    /**
     * Get the value of a key
     * @param name The key name
     * @returns A promise that resolves with the value
     * @memberof MemoryStorageInterface
     */
    getValue(name: string): Promise<string | null> {
        const value = this._store.hasOwnProperty(name) ? this._store[name] : null;
        return Promise.resolve(value);
    }

    /**
     * Remove a key
     * @param name The key name
     * @returns A promise that resolves when the removal has completed
     * @memberof MemoryStorageInterface
     */
    removeKey(name: string): Promise<void> {
        this._store[name] = undefined;
        delete this._store[name];
        return Promise.resolve();
    }

    /**
     * Set the value for a key
     * @param name The key name
     * @param value The value to set
     * @returns A promise that resolves when the value is set
     * @memberof MemoryStorageInterface
     */
    setValue(name: string, value: string): Promise<void> {
        this._store[name] = value;
        return Promise.resolve();
    }
}
