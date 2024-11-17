import EventEmitter from "eventemitter3";
import { ChannelQueue } from "@buttercup/channel-queue";
import { Layerr } from "layerr";
import { Vault } from "./Vault.js";
import { Credentials } from "../credentials/Credentials.js";
import { getCredentials, setCredentials } from "../credentials/memory/credentials.js";
import { getMasterPassword, setMasterPassword } from "../credentials/memory/password.js";
import { getUniqueID } from "../tools/encoding.js";
import {
    getSourceOfflineArchive,
    sourceHasOfflineCopy,
    storeSourceOfflineCopy
} from "../tools/vaultManagement.js";
import { credentialsToDatasource, prepareDatasourceCredentials } from "../datasources/register.js";
import { generateVaultInsights } from "../insight/vault.js";
import { AttachmentManager } from "../attachments/AttachmentManager.js";
import { TextDatasource } from "../datasources/TextDatasource.js";
import { VaultManager } from "./VaultManager.js";
import { convertFormatAVault } from "../io/formatB/conversion.js";
import { VaultFormatB } from "../index.common.js";
import { getFormatForID } from "../io/formatRouter.js";
import { VaultFormatID, VaultLiveSnapshot, VaultSourceID, VaultSourceStatus } from "../types.js";

interface StateChangeEnqueuedFunction {
    (): void | Promise<any>;
}

export interface VaultSourceConfig {
    colour?: string;
    id?: VaultSourceID;
    order?: number;
    meta?: VaultSourceMetadata;
}

export interface VaultSourceSaveOptions {
    storeOfflineCopy?: boolean;
}

export interface VaultSourceUnlockOptions {
    initialiseRemote?: boolean;
    loadOfflineCopy?: boolean;
    storeOfflineCopy?: boolean;
}

export interface VaultSourceMetadata {
    [property: string]: any;
}

const COLOUR_TEST = /^#([a-f0-9]{3}|[a-f0-9]{6})$/i;
const DEFAULT_COLOUR = "#000000";
const DEFAULT_ORDER = 1000;

function processDehydratedCredentials(
    credentialsString: string,
    masterPassword: string
): Promise<Credentials> {
    if (/^v1\n/.test(credentialsString)) {
        const [, sourceCredStr] = credentialsString.split("\n");
        return Credentials.fromSecureString(sourceCredStr, masterPassword);
    }
    return Credentials.fromSecureString(credentialsString, masterPassword);
}

/**
 * Vault source class for managing a single vault
 * within a vault manager
 * @augments EventEmitter
 * @memberof module:Buttercup
 */
export class VaultSource extends EventEmitter {
    static STATUS_LOCKED = VaultSourceStatus.Locked;
    static STATUS_PENDING = VaultSourceStatus.Pending;
    static STATUS_UNLOCKED = VaultSourceStatus.Unlocked;

    /**
     * Rehydrate the vault source from a dehydrated state
     * @param dehydratedString The dehydrated form of the vault source
     * @returns A rehydrated instance
     * @memberof VaultSource
     * @static
     */
    static rehydrate(dehydratedString: string): VaultSource {
        const target = JSON.parse(dehydratedString);
        let credentials = target.credentials;
        if (target.v !== 2) {
            const { sourceCredentials, archiveCredentials } = target;
            if (!sourceCredentials || !archiveCredentials) {
                throw new Error("Invalid legacy vault state: missing credentials");
            }
            credentials = `v1\n${sourceCredentials}\n${archiveCredentials}`;
        }
        const {
            id,
            name,
            type,
            colour = DEFAULT_COLOUR,
            order = DEFAULT_ORDER,
            meta = {}
        } = target;
        return new VaultSource(name, type, credentials, {
            id,
            colour,
            order,
            meta
        });
    }

    _attachmentManager: AttachmentManager = null;
    _colour: string;
    _credentials: string | Credentials;
    _datasource: TextDatasource = null;
    _id: VaultSourceID;
    _meta: VaultSourceMetadata;
    _name: string;
    _order: number;
    _queue: ChannelQueue;
    _shares: Array<any> = [];
    _status: VaultSourceStatus;
    _type: string;
    _vault: Vault = null;
    _vaultManager: VaultManager = null;

    constructor(
        name: string,
        type: string,
        credentialsString: string,
        config: VaultSourceConfig = {}
    ) {
        super();
        const {
            colour = DEFAULT_COLOUR,
            id = getUniqueID(),
            order = DEFAULT_ORDER,
            meta = {}
        } = config;
        // Queue for managing state transitions
        this._queue = new ChannelQueue();
        // Credentials state and status go hand-in-hand:
        //  - Locked = credentials string
        //  - Unlocked = credentials instance
        this._credentials = credentialsString;
        this._status = VaultSource.STATUS_LOCKED;
        // Set other configuration items to properties
        this._id = id;
        this._name = name;
        this._type = type;
        this._colour = colour;
        this._order = order;
        this._meta = meta;
    }

    /**
     * The attachment manager
     * @memberof VaultSource
     * @readonly
     */
    get attachmentManager(): AttachmentManager {
        return this._attachmentManager;
    }

    /**
     * Source colour
     * @memberof VaultSource
     */
    get colour(): string {
        return this._colour;
    }

    /**
     * Source ID
     * @memberof VaultSource
     * @readonly
     */
    get id(): VaultSourceID {
        return this._id;
    }

    /**
     * Meta data
     * @memberof VaultSource
     * @readonly
     */
    get meta(): VaultSourceMetadata {
        return { ...this._meta };
    }

    /**
     * Source name
     * @memberof VaultSource
     * @readonly
     */
    get name() {
        return this._name;
    }

    /**
     * The vault order on a vault management instance
     * @memberof VaultSource
     * @readonly
     */
    get order(): number {
        return this._order;
    }

    /**
     * Source status
     * @memberof VaultSource
     * @readonly
     */
    get status(): VaultSourceStatus {
        return this._status;
    }

    /**
     * The datasource type
     * @memberof VaultSource
     * @readonly
     */
    get type(): string {
        return this._type;
    }

    /**
     * Vault reference
     * @memberof VaultSource
     * @readonly
     */
    get vault(): Vault {
        return this._vault;
    }

    set colour(newColour: string) {
        if (COLOUR_TEST.test(newColour) !== true) {
            throw new Layerr(`Failed setting colour: Invalid format (expected hex): ${newColour}`);
        }
        this._colour = newColour;
        this.emit("updated");
    }

    set order(newOrder: number) {
        if (isNaN(newOrder) || typeof newOrder !== "number" || newOrder < 0) {
            throw new Layerr(
                `Failed setting order: Order must be greater than or equal to 0: ${newOrder}`
            );
        }
        this._order = newOrder;
        this.emit("updated");
    }

    /**
     * Change the master vault password
     * @param oldPassword The original/current password
     * @param newPassword The new password to change to
     * @param meta Optional metadata
     * @memberof VaultSource
     */
    async changeMasterPassword(
        oldPassword: string,
        newPassword: string,
        meta: { [key: string]: any } = {}
    ) {
        if (oldPassword === newPassword) {
            throw new Error("New password cannot be the same as the previous one");
        } else if (!newPassword) {
            throw new Error("New password must be specified");
        }
        const datasourceSupportsChange = this._datasource.supportsPasswordChange();
        const newMasterCreds = new Credentials(meta, newPassword);
        let wasLocked = false;
        if (this.status !== VaultSource.STATUS_UNLOCKED) {
            wasLocked = true;
            // Locked, so unlock
            await this.unlock(Credentials.fromPassword(oldPassword));
        } else {
            // Unlocked, so check password..
            const masterPassword = getMasterPassword((<Credentials>this._credentials).id);
            if (masterPassword !== oldPassword) {
                throw new Error("Old password does not match current unlocked instance value");
            }
            // ..and then update
            await this.update();
        }
        // Check datasource is ready
        if (datasourceSupportsChange) {
            const isReady = await this._datasource.changePassword(
                prepareDatasourceCredentials(newMasterCreds, this._datasource.type),
                /* preflight: */ true
            );
            if (!isReady) {
                throw new Error("Datasource not capable of changing password at this time");
            }
        }
        // Clear offline cache
        await storeSourceOfflineCopy(this._vaultManager._cacheStorage, this.id, null);
        // Change password
        const newCredentials = Credentials.fromCredentials(
            this._credentials as Credentials,
            oldPassword
        );
        setMasterPassword(newCredentials.id, newPassword);
        await this._updateVaultCredentials(newCredentials);
        // Re-lock if it was locked earlier
        if (wasLocked) {
            await this.lock();
        }
        // Change remote if supported
        if (datasourceSupportsChange) {
            await this._datasource.changePassword(
                prepareDatasourceCredentials(newMasterCreds, this._datasource.type),
                /* preflight: */ false
            );
        }
        this.emit("passwordChanged");
        this.emit("updated");
    }

    /**
     * Check if the vault source can be updated
     * @memberof VaultSource
     */
    canBeUpdated(): boolean {
        return this.status === VaultSource.STATUS_UNLOCKED && this._vault.format.dirty === false;
    }

    /**
     * Check if the source has an offline copy
     * @returns A promise which resolves with whether an offline
     *  copy is available or not
     * @memberof VaultSource
     */
    checkOfflineCopy() {
        return sourceHasOfflineCopy(this._vaultManager._cacheStorage, this.id);
    }

    /**
     * Convert vault to a new format
     * @param targetFormat The target format to convert to
     * @memberof VaultSource
     */
    async convert(targetFormat: VaultFormatID): Promise<void> {
        if (this.status !== VaultSource.STATUS_UNLOCKED) {
            throw new Layerr(
                `Failed converting source: Source not unlocked (${this.status}): ${this.id}`
            );
        }
        if (this.vault.format.getFormat().getFormatID() !== VaultFormatID.A) {
            throw new Layerr(`Failed converting source: Source not in expected format: ${this.id}`);
        }
        if (targetFormat !== VaultFormatID.B) {
            throw new Layerr(`Failed converting source: Target format not valid: ${this.id}`);
        }
        const formatBSource = convertFormatAVault(this.vault.format.source);
        const format = new VaultFormatB(formatBSource);
        this._vault = new Vault(format);
    }

    /**
     * Dehydrate the source to a JSON string, ready for storage
     * @memberof VaultSource
     */
    dehydrate(): Promise<string> {
        return this._enqueueStateChange(async () => {
            const payload = {
                v: 2,
                id: this.id,
                name: this.name,
                type: this.type,
                status: VaultSource.STATUS_LOCKED,
                colour: this.colour,
                order: this.order,
                meta: this.meta,
                credentials: null
            };
            if (this.status === VaultSource.STATUS_PENDING) {
                throw new Layerr(`Failed dehydrating source: Source in pending state: ${this.id}`);
            } else if (this.status === VaultSource.STATUS_LOCKED) {
                payload.credentials = this._credentials;
            } else {
                payload.credentials = await (<Credentials>this._credentials).toSecureString();
            }
            return JSON.stringify(payload);
        });
    }

    /**
     * Get a live snapshot of the current unlocked state
     * @returns A snapshot object
     * @deprecated Will be removed in next major - insecure
     */
    getLiveSnapshot(): VaultLiveSnapshot {
        if (this.status !== VaultSourceStatus.Unlocked) {
            throw new Layerr("Not possible to fetch live snapshot: Vault is not unlocked");
        }
        const credentialsID = (this._credentials as Credentials).id;
        const credentials = getCredentials(credentialsID);
        if (!credentials) {
            throw new Layerr("Failed fetching live snapshot: Invalid credentials data");
        }
        const masterPassword = getMasterPassword(credentialsID);
        return {
            credentials,
            formatID: this.vault._format.getFormat().getFormatID(),
            formatSource: this.vault._format.source,
            masterPassword,
            sourceID: this.id,
            version: "1a"
        };
    }

    /**
     * Get offline content, if it exists
     * @returns A promise a resolves with the content, or null
     *  if it doesn't exist
     * @memberof VaultSource
     */
    async getOfflineContent(): Promise<string | null> {
        const hasContent = await this.checkOfflineCopy();
        if (hasContent) {
            return getSourceOfflineArchive(this._vaultManager._cacheStorage, this.id);
        }
        return null;
    }

    /**
     * Detect whether the local archives (in memory) differ from their remote copies
     * Fetches the remote copies from their datasources and detects differences between
     * them and their local counterparts. Does not change/update the local items.
     * @returns A promise that resolves with a boolean - true if
     *      there are differences, false if there is not
     * @memberof VaultSource
     */
    localDiffersFromRemote(): Promise<boolean> {
        if (this.status !== VaultSource.STATUS_UNLOCKED) {
            return Promise.reject(
                new Layerr(
                    `Failed diffing source: Source not unlocked (${this.status}): ${this.id}`
                )
            );
        }
        if (typeof (<any>this._datasource).localDiffersFromRemote === "function") {
            return (<any>this._datasource).localDiffersFromRemote(
                prepareDatasourceCredentials(
                    this._credentials as Credentials,
                    this._datasource.type
                ),
                this.vault.format.history
            );
        }
        if (this._datasource.type !== "text") {
            // Only clear if not a TextDatasource
            this._datasource.setContent("");
        }
        return this._datasource
            .load(
                prepareDatasourceCredentials(
                    this._credentials as Credentials,
                    this._datasource.type
                )
            )
            .then(({ Format, history }) => {
                if (Format !== this.vault.format.getFormat()) {
                    throw new Error("Loaded format does not match that of current vault");
                }
                return Format.historiesDiffer(this.vault.format.history, history);
            });
    }

    /**
     * Lock the source
     * @memberof VaultSource
     */
    async lock() {
        if (this.status !== VaultSource.STATUS_UNLOCKED) {
            throw new Layerr(
                `Failed locking source: Source in invalid state (${this.status}): ${this.id}`
            );
        }
        await this._enqueueStateChange(async () => {
            this._status = VaultSource.STATUS_PENDING;
            const currentCredentials = this._credentials;
            const currentVault = this._vault;
            const currentDatasource = this._datasource;
            const currentAttachmentMgr = this._attachmentManager;
            try {
                const credentialsStr = await (<Credentials>this._credentials).toSecureString();
                this._credentials = credentialsStr;
                this._datasource = null;
                this._vault = null;
                this._attachmentManager = null;
                this._status = VaultSource.STATUS_LOCKED;
                this.emit("locked");
            } catch (err) {
                this._credentials = currentCredentials;
                this._datasource = currentDatasource;
                this._vault = currentVault;
                this._status = VaultSource.STATUS_UNLOCKED;
                this._attachmentManager = currentAttachmentMgr;
                throw new Layerr(err, "Failed locking source");
            }
        });
    }

    /**
     * Merge remote contents
     * Detects differences between a local and a remote item, and merges the
     * two copies together.
     * @returns A promise that resolves with the newly merged archive -
     *      This archive is automatically saved over the original local copy.
     * @memberof VaultSource
     */
    async mergeFromRemote(): Promise<Vault> {
        if (this._datasource.type !== "text") {
            // Only clear if not a TextDatasource
            this._datasource.setContent("");
        }
        const { Format, history } = await this._datasource.load(
            prepareDatasourceCredentials(this._credentials as Credentials, this._datasource.type)
        );
        if (Format !== this._vault.format.getFormat()) {
            throw new Error("Format loaded during merge did not match current");
        }
        const newVault = Format.vaultFromMergedHistories(history, this._vault.format.history);
        this._vault._updateFormat(newVault.format);
        return this._vault;
    }

    /**
     * Rename the vault source
     * @param name The new name
     * @memberof VaultSource
     */
    rename(name: string): void {
        this._name = name;
        this.emit("updated");
    }

    /**
     * Restore unlocked state from a live snapshot
     * @param snapshot The snapshot taken previously
     * @deprecated Will be removed in next major - insecure
     */
    async restoreFromLiveSnapshot(snapshot: VaultLiveSnapshot): Promise<void> {
        if (this.status !== VaultSourceStatus.Locked) {
            throw new Layerr("Cannot restore live snapshot: Vault is not locked");
        }
        if (snapshot.version !== "1a") {
            throw new Layerr(
                `Failed restoring live snapshot: Snapshot version unsupported or unrecognised: ${snapshot.version}`
            );
        }
        // Setup credentials and datasource
        const credentials = (this._credentials = new Credentials(
            snapshot.credentials.data,
            snapshot.masterPassword
        ));
        setCredentials(credentials.id, snapshot.credentials);
        // Initialise datasource
        const datasource = (this._datasource = credentialsToDatasource(
            Credentials.fromCredentials(credentials, snapshot.masterPassword)
        ));
        datasource.sourceID = this.id;
        // Setup vault
        const Format = getFormatForID(snapshot.formatID);
        this._vault = new Vault(new Format(snapshot.formatSource));
        // Set statuses
        this._status = VaultSource.STATUS_UNLOCKED;
        this._attachmentManager = new AttachmentManager(this);
        this.emit("unlocked");
    }

    /**
     * Save the vault to the remote, ensuring that it's first merged and
     * updated to prevent conflicts or overwrites.
     * @memberof VaultSource
     */
    async save(config: VaultSourceSaveOptions = {}) {
        const { storeOfflineCopy = true } = config;
        await this._enqueueStateChange(async () => {
            if (await this.localDiffersFromRemote()) {
                await this.mergeFromRemote();
            }
            // Capture encrypted content
            let encryptedContent: string = null;
            const encryptedCallback = ({ content }) => {
                encryptedContent = content;
            };
            this._datasource.once("encryptedContent", encryptedCallback);
            // Save
            try {
                await this._datasource.save(
                    this._vault.format.history,
                    prepareDatasourceCredentials(
                        this._credentials as Credentials,
                        this._datasource.type
                    )
                );
            } catch (err) {
                this._datasource.off("encryptedContent", encryptedCallback);
                throw err;
            }
            // Clear state
            this._vault.format.dirty = false;
            // Handle offline state
            if (storeOfflineCopy && encryptedContent) {
                // Store an offline copy for later use
                await storeSourceOfflineCopy(
                    this._vaultManager._cacheStorage,
                    this.id,
                    encryptedContent
                );
            }
            // Misc
            await this._updateInsights();
        }, /* stack */ "saving");
        this.emit("updated");
    }

    supportsAttachments(): boolean {
        if (this.status !== VaultSource.STATUS_UNLOCKED) return false;
        return this._datasource.supportsAttachments();
    }

    async testMasterPassword(password: string): Promise<boolean> {
        if (
            this.status !== VaultSourceStatus.Locked &&
            this.status !== VaultSourceStatus.Unlocked
        ) {
            throw new Error(`Source in invalid state for password test: ${this.status}`);
        }
        const credStr =
            this.status === VaultSourceStatus.Locked
                ? (this._credentials as string)
                : await (<Credentials>this._credentials).toSecureString();
        try {
            await processDehydratedCredentials(credStr, password);
            return true;
        } catch (err) {
            return false;
        }
    }

    async unlock(vaultCredentials: Credentials, config: VaultSourceUnlockOptions = {}) {
        if (!Credentials.isCredentials(vaultCredentials)) {
            throw new Layerr(
                `Failed unlocking source: Invalid credentials passed to source: ${this.id}`
            );
        }
        const {
            initialiseRemote = false,
            loadOfflineCopy = false,
            storeOfflineCopy = true
        } = config;
        if (this.status !== VaultSource.STATUS_LOCKED) {
            throw new Layerr(
                `Failed unlocking source: Source in invalid state (${this.status}): ${this.id}`
            );
        }
        const masterPassword = getMasterPassword(vaultCredentials.id);
        const originalCredentials = this._credentials;
        this._status = VaultSource.STATUS_PENDING;
        await this._enqueueStateChange(async () => {
            // Get offline content if available and requested
            const offlineContent = loadOfflineCopy ? await this.getOfflineContent() : null;
            const credentials: Credentials = (this._credentials =
                await processDehydratedCredentials(this._credentials as string, masterPassword));
            // Initialise datasource
            const datasource = (this._datasource = credentialsToDatasource(
                Credentials.fromCredentials(credentials, masterPassword)
            ));
            datasource.sourceID = this.id;
            if (typeof offlineContent === "string") {
                datasource.setContent(offlineContent);
            }
            // Listen for datasource updates
            datasource.on("updated", () => {
                this._waitNonPending()
                    .then(async () => {
                        if (this.status === VaultSource.STATUS_UNLOCKED) {
                            await this._updateCredentialsFromDatasource();
                        }
                        this.emit("updated");
                    })
                    .catch((err) => {
                        console.error(
                            `Error updating datasource credentials for vault: ${this.id}`,
                            err
                        );
                    });
            });
            // Perform pre-save or load
            if (initialiseRemote) {
                const defaultVault = Vault.createWithDefaults();
                await datasource.save(defaultVault.format.history, credentials);
                this._vault = defaultVault;
            } else {
                const { Format, history } = await datasource.load(credentials);
                this._vault = Vault.createFromHistory(history, Format);
            }
            // Optimise storage
            try {
                this._vault.format.optimise();
            } catch (err) {
                throw new Layerr(err, "Failed optimising vault format");
            }
            // Handle offline state
            if (storeOfflineCopy) {
                // Store an offline copy for later use
                await storeSourceOfflineCopy(
                    this._vaultManager._cacheStorage,
                    this.id,
                    datasource._content
                );
            }
            if (loadOfflineCopy) {
                // Flag the format as read-only
                this.vault.format._readOnly = true;
            }
            // Configure source status
            this._status = VaultSource.STATUS_UNLOCKED;
            this._attachmentManager = new AttachmentManager(this);
            this.emit("unlocked");
        }).catch((err) => {
            this._status = VaultSource.STATUS_LOCKED;
            this._vault = null;
            this._datasource = null;
            this._credentials = originalCredentials;
            this._attachmentManager = null;
            throw new Layerr(err, "Failed unlocking source");
        });
    }

    /**
     * Update the vault
     * @returns A promise that resolves once the update has
     *  completed
     * @memberof VaultSource
     */
    async update({ skipDiff = false } = {}) {
        const didUpdate = await this._enqueueStateChange(
            () =>
                (skipDiff ? Promise.resolve(false) : this.localDiffersFromRemote()).then(
                    (differs) => {
                        if (differs) {
                            return this.mergeFromRemote().then(() => true);
                        }
                        return false;
                    }
                ),
            // @todo shares
            // .then(() => initialiseShares(this)),
            /* stack */ "updating"
        );
        if (didUpdate) {
            this.emit("updated");
        }
    }

    /**
     * Write the vault to the remote
     * - This does not perform any merging or sync checks, but simply
     * writes the vault contents to the remote, overwriting whatever
     * was there before.
     * @returns A promise that resolves when saving has completed
     * @memberof VaultSource
     */
    async write() {
        await this._enqueueStateChange(async () => {
            await this._datasource.save(
                this._vault.format.history,
                prepareDatasourceCredentials(
                    this._credentials as Credentials,
                    this._datasource.type
                )
            );
            this._vault.format.dirty = false;
            await this._updateInsights();
        }, /* stack */ "saving");
        this.emit("updated");
    }

    _applyShares() {
        // @todo
        // this._shares.forEach(share => {
        //     if (!share.archiveHasAppliedShare(this.archive)) {
        //         share.applyToArchive(this.archive);
        //     }
        // });
    }

    _enqueueStateChange(cb: StateChangeEnqueuedFunction, stack?: string): Promise<any> {
        const channel = this._queue.channel("state");
        return stack ? channel.enqueue(cb, undefined, stack) : channel.enqueue(cb);
    }

    _unloadShares() {
        const Format = this.vault.format.getFormat();
        const extractedShares = Format.extractSharesFromHistory(this.vault.format.history);
        // Reset archive history (without shares)
        const { base } = extractedShares;
        delete extractedShares.base;
        this.vault.format.erase();
        this.vault.format.execute(base);
        // Update share payloads
        Object.keys(extractedShares).forEach((shareID) => {
            const share = this._shares.find((share) => share.id === shareID);
            if (!share) {
                throw new Error(
                    `Failed updating extracted share: No share found in workspace for ID: ${shareID}`
                );
            }
            share.updateHistory(extractedShares[shareID]);
        });
    }

    async _updateCredentialsFromDatasource() {
        if (this.status !== VaultSource.STATUS_UNLOCKED) {
            throw new Layerr(
                `Failed updating source credentials: Source is not unlocked: ${this.id}`
            );
        }
        const masterPassword = getMasterPassword((<Credentials>this._credentials).id);
        this._credentials = Credentials.fromCredentials(
            this._datasource.credentials,
            masterPassword
        );
    }

    async _updateInsights() {
        if (this.status !== VaultSource.STATUS_UNLOCKED) {
            throw new Layerr(`Failed updating vault insights: Source is not unlocked: ${this.id}`);
        }
        const insights = generateVaultInsights(this.vault);
        await this._datasource.updateInsights(insights);
    }

    async _updateVaultCredentials(newCredentials) {
        if (this.status !== VaultSource.STATUS_UNLOCKED) {
            throw new Layerr(
                `Failed updating vault credentials: Source is not unlocked: ${this.id}`
            );
        }
        this._credentials = newCredentials;
        await this.write();
    }

    _waitNonPending() {
        return new Promise<void>((resolve) => {
            if (this.status !== VaultSource.STATUS_PENDING) return resolve();
            const handleChange = () => {
                this.removeListener("unlocked", handleChange);
                this.removeListener("locked", handleChange);
                resolve();
            };
            this.on("unlocked", handleChange);
            this.on("locked", handleChange);
        });
    }
}
