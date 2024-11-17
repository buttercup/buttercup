import { Credentials } from "../credentials/Credentials.js";
import { Entry } from "../core/Entry.js";
import { Vault } from "../core/Vault.js";
import { VaultSource } from "../core/VaultSource.js";
import { getSharedAppEnv } from "../env/appEnv.js";
import { generateUUID } from "../tools/uuid.js";
import { decryptAttachment, encryptAttachment, getBufferSize } from "../tools/attachments.js";
import { AttachmentDetails } from "../types.js";

const ATTACHMENTS_KEY_LENGTH = 48;

export class AttachmentManager {
    /**
     * Get a new attachment ID
     * @static
     */
    static newAttachmentID(): string {
        return generateUUID();
    }

    _credentials: Credentials;
    _source: VaultSource;

    /**
     * Constructor for new attachment managers
     * @param vaultSource The vault source to attach to. This is
     *  normally set by the VaultSource automatically when unlocking a source.
     */
    constructor(vaultSource: VaultSource) {
        this._source = vaultSource;
    }

    /**
     * Get an attachment's data
     * @param entry Entry instance the attachment can be found on
     * @param attachmentID The attachment ID
     * @throws {Error} Throws if the attachment isn't found
     */
    async getAttachment(entry: Entry, attachmentID: string): Promise<Buffer | ArrayBuffer> {
        this._checkAttachmentSupport();
        const details = await this.getAttachmentDetails(entry, attachmentID);
        if (!details) {
            throw new Error(`Attachment not available: ${attachmentID}`);
        }
        const credentials = await this._getAttachmentsCredentials();
        const data = await this._source._datasource.getAttachment(
            this._source.vault.id,
            attachmentID
        );
        return decryptAttachment(data, credentials);
    }

    /**
     * Get an attachment's details
     * @param entry Entry instance the attachment can be found on
     * @param attachmentID The attachment ID
     * @returns The details or null if the attachment isn't found
     */
    async getAttachmentDetails(entry: Entry, attachmentID: string): Promise<AttachmentDetails> {
        this._checkAttachmentSupport();
        const attributeKey = `${Entry.Attributes.AttachmentPrefix}${attachmentID}`;
        const payloadRaw = entry.getAttribute(attributeKey) as string;
        return payloadRaw ? JSON.parse(payloadRaw) : null;
    }

    /**
     * List all attachments
     * @param entry Entry instance the attachment can be found on
     */
    async listAttachments(entry: Entry): Promise<Array<AttachmentDetails>> {
        this._checkAttachmentSupport();
        const attributes = entry.getAttribute();
        const attachmentKeys = Object.keys(attributes).filter(
            (key) => key.indexOf(Entry.Attributes.AttachmentPrefix) === 0
        );
        return attachmentKeys.map((key) => JSON.parse(attributes[key]));
    }

    /**
     * Remove an attachment, deleting the file and removing it from
     *  the entry
     * @param entry Entry instance the attachment can be found on
     * @param attachmentID The attachment ID
     */
    async removeAttachment(entry: Entry, attachmentID: string) {
        this._checkAttachmentSupport();
        const attributeKey = `${Entry.Attributes.AttachmentPrefix}${attachmentID}`;
        // Remove data
        await this._source._datasource.removeAttachment(this._source.vault.id, attachmentID);
        // Remove in entry
        entry.deleteAttribute(attributeKey);
    }

    /**
     * Write an attachment to an entry.
     * Creates a new attachment or updates an existing one, by attachment ID
     * @param entry Entry instance the attachment can be found on
     * @param attachmentID The attachment ID
     * @param attachmentData The attachment's data
     * @param name The file name
     * @param type The MIME type
     * @param timestamp Optional timestamp override for the creation of the
     *  attachment
     */
    async setAttachment(
        entry: Entry,
        attachmentID: string,
        attachmentData: Buffer | ArrayBuffer,
        name: string,
        type: string,
        timestamp = new Date()
    ) {
        this._checkAttachmentSupport();
        if (!name || !type) {
            throw new Error(`Attachment properties required: name/type => ${name}/${type}`);
        }
        const attributeKey = `${Entry.Attributes.AttachmentPrefix}${attachmentID}`;
        // Check if it already exists
        const existingDetails = await this.getAttachmentDetails(entry, attachmentID);
        // Get credentials
        const credentials = await this._getAttachmentsCredentials();
        // Encrypt it
        const encryptedAttachmentData = await encryptAttachment(attachmentData, credentials);
        const encryptedSize = getBufferSize(encryptedAttachmentData);
        const originalSize = getBufferSize(attachmentData);
        // Calculate if it can fit in storage
        const sizeIncrease = existingDetails
            ? Math.max(0, encryptedSize - existingDetails.sizeEncrypted)
            : encryptedSize;
        const spaceAvailable = await this._source._datasource.getAvailableStorage();
        if (spaceAvailable !== null && sizeIncrease > spaceAvailable) {
            throw new Error(
                `Not enough space to update attachment: needed = ${sizeIncrease} B, available = ${spaceAvailable} B`
            );
        }
        // Create payload
        const now = timestamp.toUTCString();
        const payload = {
            id: attachmentID,
            name,
            type,
            sizeOriginal: originalSize,
            sizeEncrypted: encryptedSize,
            created: now,
            updated: now
        };
        // Write attachment
        await this._source._datasource.putAttachment(
            this._source.vault.id,
            attachmentID,
            encryptedAttachmentData,
            payload
        );
        // Set in entry
        entry.setAttribute(attributeKey, JSON.stringify(payload));
    }

    _checkAttachmentSupport() {
        if (!this._source.supportsAttachments()) {
            throw new Error(`Attachments not supported on source: ${this._source.id}`);
        }
    }

    async _getAttachmentsCredentials() {
        const { vault } = this._source;
        let key = vault.getAttribute(Vault.Attribute.AttachmentsKey) as string;
        if (!key) {
            // Create key for first-time use
            const generateRandomString = getSharedAppEnv().getProperty("crypto/v1/randomString");
            key = await generateRandomString(ATTACHMENTS_KEY_LENGTH);
            vault.setAttribute(Vault.Attribute.AttachmentsKey, key);
            // Save the key
            await this._source.save();
        }
        return Credentials.fromPassword(key);
    }
}
