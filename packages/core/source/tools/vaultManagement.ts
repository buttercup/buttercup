import { StorageInterface } from "../storage/StorageInterface.js";
import { VaultSourceID } from "../types.js";

const STORAGE_PREFIX = "bcup_archivecache_";

export function getSourceOfflineArchive(
    storage: StorageInterface,
    sourceID: VaultSourceID
): Promise<any> {
    const sourceKey = `${STORAGE_PREFIX}${sourceID}`;
    return storage.getValue(sourceKey);
}

export function sourceHasOfflineCopy(
    storage: StorageInterface,
    sourceID: VaultSourceID
): Promise<boolean> {
    return getSourceOfflineArchive(storage, sourceID).then(
        (archiveContents) => !!archiveContents && archiveContents.length > 0
    );
}

export function storeSourceOfflineCopy(
    storage: StorageInterface,
    sourceID: VaultSourceID,
    content: string
): Promise<void> {
    const sourceKey = `${STORAGE_PREFIX}${sourceID}`;
    return storage.setValue(sourceKey, content);
}
