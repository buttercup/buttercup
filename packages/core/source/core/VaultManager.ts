import EventEmitter from "eventemitter3";
import { Layerr } from "layerr";
import isPromise from "is-promise";
import { ChannelQueue } from "@buttercup/channel-queue";
import { MemoryStorageInterface } from "../storage/MemoryStorageInterface.js";
import { VaultSource } from "./VaultSource.js";
import { StorageInterface } from "../storage/StorageInterface.js";
import { SetTimeout, VaultLiveSnapshot, VaultSourceID, VaultSourceStatus } from "../types.js";

export interface InterruptedAutoUpdateFunction {
    (): void | Promise<any>;
}

interface StateChangeEnqueuedFunction {
    (): void | Promise<any>;
}

export interface VaultManagerAddSourceOptions {
    order?: number;
}

export interface VaultManagerOptions {
    autoUpdate?: boolean;
    autoUpdateDelay?: number;
    cacheStorage?: StorageInterface;
    sourceStorage?: StorageInterface;
}

const DEFAULT_AUTO_UPDATE_DELAY = 1000 * 60 * 2.5; // 2.5 mins
const NOOP = () => {};
const STORAGE_KEY_PREFIX = "bcup_vaultmgr_";
const STORAGE_KEY_PREFIX_TEST =
    /^bcup_vaultmgr_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

/**
 * Vault manager, to manage vault sources and their vaults
 * @augments EventEmitter
 * @memberof module:Buttercup
 */
export class VaultManager extends EventEmitter {
    /**
     * Key prefix for stored vaults
     * @static
     * @memberof VaultManager
     */
    static STORAGE_KEY_PREFIX = STORAGE_KEY_PREFIX;

    _autoUpdateDelay: number;
    _autoUpdateEnabled: boolean;
    _autoUpdateTimer: SetTimeout = null;
    _cacheStorage: StorageInterface;
    _initialised: boolean = false;
    _queue = new ChannelQueue();
    _sources: Array<VaultSource> = [];
    _sourceStorage: StorageInterface;

    /**
     * Construct a new VaultManager
     * @param opts Configuration options
     */
    constructor(opts: VaultManagerOptions = {}) {
        super();
        const {
            autoUpdate = true,
            autoUpdateDelay = DEFAULT_AUTO_UPDATE_DELAY,
            cacheStorage = new MemoryStorageInterface(),
            sourceStorage = new MemoryStorageInterface()
        } = opts;
        this._cacheStorage = cacheStorage;
        this._sourceStorage = sourceStorage;
        this._autoUpdateEnabled = autoUpdate;
        this._autoUpdateDelay = autoUpdateDelay;
    }

    /**
     * Array of vault sources
     * @readonly
     * @memberof VaultManager
     */
    get sources(): Array<VaultSource> {
        return [...this._sources];
    }

    /**
     * Array of unlocked vault sources
     * @readonly
     * @memberof VaultManager
     */
    get unlockedSources(): Array<VaultSource> {
        return this._sources.filter((source) => source.status === VaultSource.STATUS_UNLOCKED);
    }

    /**
     * @typedef {Object} VaultManagerAddSourceOptions
     * @property {Number=} order Optional order override
     */

    /**
     * Add a VaultSource to the VaultManager
     * - The vault manager will then provide a management
     * platform for the source, including storage access and
     * event aggregation.
     * @param source The source to add
     * @param opts Options for adding the
     *  source
     * @memberof VaultManager
     */
    async addSource(source: VaultSource, opts: VaultManagerAddSourceOptions = {}) {
        const { order: orderOverride } = opts;
        const existing = this._sources.find((src) => src.id === source.id);
        if (existing) return;
        await this.enqueueStateChange(async () => {
            source._vaultManager = this;
            const newOrder =
                typeof orderOverride === "number" ? orderOverride : this.getNextOrder();
            this._sources.push(source);
            // Configure the order
            source.order = newOrder;
            // Attach event listeners
            source.on("updated", () => this.dehydrateSource(source));
            source.on("updated", () => this.emit("sourcesUpdated"));
            source.on("locked", () => this.emit("sourcesUpdated"));
            source.on("unlocked", () => this.emit("sourcesUpdated"));
            const dehydratedString = await source.dehydrate();
            await this._storeDehydratedSource(source.id, dehydratedString);
            this.emit("sourcesUpdated");
        });
    }

    /**
     * Dehydrate all sources and write them to storage
     * @returns A promise that resolves once all sources have been dehydrated
     * @memberof VaultManager
     */
    async dehydrate() {
        await this.enqueueStateChange(() =>
            Promise.all(this._sources.map((source) => this.dehydrateSource(source)))
        );
    }

    /**
     * Dehydrate a single vault source
     * @param sourceID The ID of the source
     * @returns A promise that resolves once the source has been dehydrated
     * @memberof VaultManager
     */
    async dehydrateSource(sourceOrSourceID: VaultSource | VaultSourceID) {
        const source =
            typeof sourceOrSourceID === "string"
                ? this.getSourceForID(sourceOrSourceID)
                : sourceOrSourceID;
        const dehydratedString = await source.dehydrate();
        await this._storeDehydratedSource(source.id, dehydratedString);
    }

    /**
     * Enqueue an asychronous change of state
     * @param cb Callback to enqueue
     * @memberof VaultManager
     */
    enqueueStateChange(cb: StateChangeEnqueuedFunction) {
        return this._queue.channel("state").enqueue(cb);
    }

    /**
     * Fetch all currently available Live Snapshots of vaults
     * @returns An array of snapshot objects
     * @deprecated Will be removed in next major - insecure
     */
    getLiveSnapshots(): Array<VaultLiveSnapshot> {
        return this.unlockedSources.map((source) => source.getLiveSnapshot());
    }

    /**
     * Get the next viable order number for a new source
     * @returns The new order
     * @memberof VaultManager
     */
    getNextOrder(): number {
        return Math.max(...this._sources.map((source) => source._order), -1) + 1;
    }

    /**
     * Get a source for an ID
     * @param sourceID The source ID
     * @returns The source with the matching ID or null if not found
     * @memberof VaultManager
     */
    getSourceForID(sourceID: VaultSourceID): VaultSource | null {
        const source = this._sources.find((target) => target.id && target.id === sourceID);
        return source || null;
    }

    /**
     * Get an array of sources that can be updated
     * @memberof VaultManager
     */
    getUpdateableSources(): Array<VaultSource> {
        return this._sources.filter((source) => source.canBeUpdated());
    }

    /**
     * Initialise the vault manager
     * @memberof VaultManager
     */
    initialise() {
        if (this._initialised) return;
        this._startAutoUpdateTimer();
        this._initialised = true;
    }

    /**
     * Wait for and interrupt state changes when auto-update is running
     * @param cb The callback to execute during the auto-update interruption
     * @returns A promise that resolves when ready
     * @memberof VaultManager
     * @example
     *  vaultManager.interruptAutoUpdate(() => {
     *      // Do something with auto-updating paused
     *  });
     */
    interruptAutoUpdate(cb: InterruptedAutoUpdateFunction) {
        return this.enqueueStateChange(NOOP).then(() =>
            this._queue.channel("autoUpdateInterrupt").enqueue(() => {
                const enabled = this._autoUpdateEnabled;
                const delay = this._autoUpdateDelay;
                this.toggleAutoUpdating(false);
                const restoreAutoUpdating = () => {
                    this.toggleAutoUpdating(enabled, delay);
                };
                let retVal: any;
                try {
                    retVal = cb();
                } catch (err) {
                    // Callback died, so restore and throw
                    restoreAutoUpdating();
                    throw err;
                }
                if (!isPromise(retVal)) {
                    // No promise, so restore immediately:
                    restoreAutoUpdating();
                    return retVal;
                }
                return (<Promise<any>>retVal)
                    .then((res) => {
                        // Wait until after the promise has completed
                        // or failed:
                        restoreAutoUpdating();
                        return res;
                    })
                    .catch((err) => {
                        restoreAutoUpdating();
                        throw err;
                    });
            })
        );
    }

    /**
     * Rehydrate sources from storage
     * @returns A promise that resolves once rehydration has completed
     * @memberof VaultManager
     * @throws {Layerr} Rejects if rehydrating from storage fails
     */
    async rehydrate() {
        await this._migrateLegacyVaults();
        const storageKeys = await this._sourceStorage.getAllKeys();
        await Promise.all(
            storageKeys
                .filter((key) => STORAGE_KEY_PREFIX_TEST.test(key))
                .map(async (key) => {
                    const dehydratedSource = await this._sourceStorage.getValue(key);
                    const source = VaultSource.rehydrate(dehydratedSource);
                    await this.addSource(source, {
                        order: source.order
                    });
                })
        );
        this.reorderSources();
        this.emit("sourcesUpdated");
    }

    /**
     * Remove a source from the storage
     * @param sourceID The ID of the source to remove
     * @returns A promise that resolves once the source has been removed
     * @memberof VaultManager
     */
    async removeSource(sourceID: VaultSourceID) {
        await this.enqueueStateChange(async () => {
            const sourceIndex = this._sources.findIndex((source) => source.id === sourceID);
            if (sourceIndex === -1) {
                throw new Layerr(`Failed removing source: No source found for ID: ${sourceID}`);
            }
            const source = this.sources[sourceIndex];
            source.removeAllListeners();
            this._sources.splice(sourceIndex, 1);
            this.emit("sourcesUpdated");
            await this._sourceStorage.removeKey(`${STORAGE_KEY_PREFIX}${sourceID}`);
        });
    }

    /**
     * Reorder a source
     * @param sourceID The ID of the source to reorder
     * @param position The 0-based position to move the source to
     * @memberof VaultManager
     * @throws {Layerr} Throws if no source is found
     */
    async reorderSource(sourceID: VaultSourceID, position: number): Promise<void> {
        const source = this.getSourceForID(sourceID);
        if (!source) {
            throw new Layerr(`Failed reordering source: No source found for ID: ${sourceID}`);
        }
        if (position === source._order) {
            return;
        }
        const originalOrder = source._order;
        source._order = position;
        const movingUp = position < originalOrder;
        this.sources.forEach((otherSource) => {
            if (otherSource.id !== sourceID) {
                if (movingUp && otherSource._order >= position) {
                    otherSource._order += 1;
                } else if (!movingUp && otherSource._order <= position) {
                    otherSource._order -= 1;
                }
            }
        });
        this.reorderSources();
        // Sync orders to storage
        await this.dehydrateSource(source);
    }

    /**
     * Reorder all sources
     * @memberof VaultManager
     */
    reorderSources() {
        this._sources.sort((sourceA, sourceB) => {
            if (sourceA._order > sourceB._order) {
                return 1;
            } else if (sourceB._order > sourceA._order) {
                return -1;
            }
            return 0;
        });
        this._sources.forEach((source, index) => {
            source._order = index;
        });
        this.emit("sourcesUpdated");
    }

    /**
     * Restore all sources from snapshots that were taken previously
     * @param snapshots An array of snapshot objects
     * @deprecated Will be removed in next major - insecure
     */
    async restoreLiveSnapshots(snapshots: Array<VaultLiveSnapshot>) {
        await Promise.all(
            snapshots.map(async (snapshot) => {
                const source = this.sources.find((src) => (snapshot.sourceID = src.id));
                if (!source || source.status !== VaultSourceStatus.Locked) {
                    // Skip source snapshot
                    return;
                }
                await source.restoreFromLiveSnapshot(snapshot);
            })
        );
    }

    /**
     * Toggle auto updating of sources
     * @param enable Enable or disable auto updating. Leave empty
     *  to invert the setting
     * @param delay Milliseconds between updates
     * @memberof VaultManager
     */
    toggleAutoUpdating(
        enable: boolean = !this._autoUpdateEnabled,
        delay: number = this._autoUpdateDelay
    ) {
        if (enable) {
            this._autoUpdateDelay = delay;
            this._startAutoUpdateTimer();
        } else {
            this._stopAutoUpdateTimer();
        }
    }

    _autoUpdateSources() {
        this.emit("autoUpdateStart");
        return this.enqueueStateChange(async () => {
            const updateableSources = this.getUpdateableSources();
            if (updateableSources.length <= 0) {
                return;
            }
            await Promise.all(
                updateableSources.map((source) =>
                    source.update().catch((err) => {
                        // we don't return auto-update errors, but emit them
                        console.error(`Failed auto-updating source: ${source.id}`, err);
                        this.emit("autoUpdateFailed", { source, error: err });
                    })
                )
            );
            this.emit("autoUpdateStop");
        });
    }

    async _migrateLegacyVaults() {
        const legacyPrefix = "bcup_archivemgr_";
        const storageKeys = await this._sourceStorage.getAllKeys();
        await Promise.all(
            storageKeys
                .filter((key) => key && key.indexOf(legacyPrefix) === 0)
                .map(async (key) => {
                    const value = await this._sourceStorage.getValue(key);
                    if (!value) return;
                    const newKey = key.replace(legacyPrefix, STORAGE_KEY_PREFIX);
                    await this._sourceStorage.setValue(newKey, value);
                    await this._sourceStorage.removeKey(key);
                })
        );
    }

    async _startAutoUpdateTimer() {
        await this.enqueueStateChange(() => {
            clearTimeout(this._autoUpdateTimer);
            this._autoUpdateTimer = setTimeout(() => {
                this._autoUpdateSources().then(() => {
                    if (this._autoUpdateEnabled) {
                        this._startAutoUpdateTimer();
                    }
                });
            }, this._autoUpdateDelay);
        });
    }

    async _stopAutoUpdateTimer() {
        await this.enqueueStateChange(() => {
            clearTimeout(this._autoUpdateTimer);
            this._autoUpdateTimer = null;
        });
    }

    _storeDehydratedSource(id: VaultSourceID, dehydratedSource: string) {
        return this._sourceStorage.setValue(`${STORAGE_KEY_PREFIX}${id}`, dehydratedSource);
    }
}
