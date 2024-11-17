/**
 * Storage Interface (stub only)
 * @see MemoryStorageInterface
 * @memberof module:Buttercup
 */
export class StorageInterface {
    /**
     * Get all keys as an array
     * @memberof StorageInterface
     */
    getAllKeys(): Promise<Array<string>> {
        return Promise.resolve([]);
    }

    /**
     * Get a value for a key
     * @memberof StorageInterface
     */
    getValue(name: string): Promise<string | null> {
        return Promise.resolve(null);
    }

    /**
     * Remove a value for a key
     * @memberof StorageInterface
     */
    removeKey(name: string): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Set a value for a key
     * @memberof StorageInterface
     */
    setValue(name: string, value: string): Promise<void> {
        return Promise.resolve();
    }
}
