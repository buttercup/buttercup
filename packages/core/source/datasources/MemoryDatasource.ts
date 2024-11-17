import { TextDatasource } from "./TextDatasource.js";
import { fireInstantiationHandlers, registerDatasource } from "./register.js";
import { Credentials } from "../credentials/Credentials.js";
import { getCredentials } from "../credentials/memory/credentials.js";
import {
    AttachmentDetails,
    BufferLike,
    DatasourceConfigurationMemory,
    DatasourceLoadedData,
    EncryptedContent,
    History,
    MemoryStore,
    VaultID
} from "../types.js";

const TYPE = "memory";

/**
 * Memory datasource for temporary storage
 * @augments TextDatasource
 * @memberof module:Buttercup
 */
export class MemoryDatasource extends TextDatasource {
    protected _property: string;
    private _store: MemoryStore;

    /**
     * Constructor for the datasource
     * @param credentials The credentials instance with which to
     *  use to configure the datasource
     */
    constructor(credentials: Credentials) {
        super(credentials);
        const { data: credentialData } = getCredentials(credentials.id);
        const { datasource: datasourceConfig } = credentialData as {
            datasource: DatasourceConfigurationMemory;
        };
        const { property } = datasourceConfig;
        this._property = property;
        this._store = global[property] = global[property] || {};
        this.type = TYPE;
        fireInstantiationHandlers(TYPE, this);
    }

    /**
     * Ensure attachment paths exist
     * @memberof MemoryDatasource
     * @protected
     */
    async _ensureAttachmentsPaths(vaultID: VaultID): Promise<void> {
        this._store.attachments = this._store.attachments || {};
        this._store.attachments[vaultID] = this._store.attachments[vaultID] || {};
    }

    /**
     * Get attachment buffer
     * - Loads the attachment contents into a buffer
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @memberof MemoryDatasource
     */
    getAttachment(vaultID: VaultID, attachmentID: string): Promise<BufferLike> {
        return this._ensureAttachmentsPaths(vaultID).then(() => {
            if (!this._store.attachments[vaultID][attachmentID]) {
                throw new Error(`No attachment found for ID: ${attachmentID}`);
            }
            return this._store.attachments[vaultID][attachmentID];
        });
    }

    /**
     * Get the datasource configuration
     * @memberof MemoryDatasource
     */
    getConfiguration(): DatasourceConfigurationMemory {
        return {
            type: "memory",
            property: this._property
        };
    }

    /**
     * Load from a global property
     * @param credentials The credentials for decryption
     * @returns A promise resolving with vault history
     * @memberof MemoryDatasource
     */
    async load(credentials: Credentials): Promise<DatasourceLoadedData> {
        if (!this._store.vault) {
            throw new Error("No vault in memory");
        }
        this.setContent(this._store.vault);
        return super.load(credentials);
    }

    /**
     * Put encrypted attachment data
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @param buffer The attachment data
     * @param details Attachment details
     * @memberof MemoryDatasource
     */
    putAttachment(
        vaultID: VaultID,
        attachmentID: string,
        buffer: BufferLike,
        details: AttachmentDetails
    ): Promise<void> {
        return this._ensureAttachmentsPaths(vaultID).then(() => {
            this._store.attachments[vaultID][attachmentID] = buffer;
        });
    }

    /**
     * Remove an attachment
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @memberof MemoryDatasource
     */
    removeAttachment(vaultID: VaultID, attachmentID: string): Promise<void> {
        return this._ensureAttachmentsPaths(vaultID).then(() => {
            this._store.attachments[vaultID][attachmentID] = null;
            delete this._store.attachments[vaultID][attachmentID];
        });
    }

    /**
     * Save vault history memory
     * @param history The vault history to save
     * @param credentials The credentials to save with
     * @returns A promise that resolves when saving is complete
     * @memberof MemoryDatasource
     */
    save(history: History, credentials: Credentials): Promise<EncryptedContent> {
        return super.save(history, credentials).then((encrypted) => {
            this._store.vault = encrypted;
            return encrypted;
        });
    }

    /**
     * Whether or not the datasource supports attachments
     * @memberof MemoryDatasource
     */
    supportsAttachments(): boolean {
        return true;
    }
}

registerDatasource(TYPE, MemoryDatasource);
