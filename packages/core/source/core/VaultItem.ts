import { Vault } from "./Vault.js";
import { VaultPermission } from "../types.js";

/**
 * Base vault member class (for Entry, Group etc.)
 */
export class VaultItem {
    _boundUpdateRefs: () => void;

    _source: any;

    /**
     * Reference to the containing vault
     * @protected
     */
    _vault: Vault = null;

    /**
     * Constructor for the vault member base class
     * @param {Vault} vault Vault reference
     * @param {Object} source Remote source object reference
     */
    constructor(vault: Vault, source: any) {
        this._vault = vault;
        this._source = source;
        this._source.permissions = this._source.permissions || [
            VaultPermission.Manage,
            VaultPermission.Read,
            VaultPermission.Write
        ];
    }

    /**
     * The ID of the entry or group
     * @readonly
     */
    get id(): string {
        return this._vault.format.getItemID(this._source);
    }

    /**
     * The current granted permissions
     */
    get permissions(): Array<string> {
        return [...this._source.permissions];
    }

    /**
     * The vault this item belongs to
     * @readonly
     */
    get vault(): Vault {
        return this._vault;
    }

    /**
     * Grant a new permission to the member
     * @param perm The permission to grant
     */
    grantPermission(perm: string) {
        if (!this.hasPermission(perm)) {
            this._source.permissions.push(perm);
        }
    }

    /**
     * Check if the member has a permission
     * @param perm The permission to check for
     */
    hasPermission(perm: string): boolean {
        return this._source.permissions.includes(perm);
    }

    /**
     * Revoke all permissions
     */
    revokeAllPermissions() {
        this._source.permissions = [];
    }

    /**
     * Revoke a single permission
     * @param perm The permission to revoke
     */
    revokePermission(perm: string) {
        this._source.permissions = this._source.permissions.filter((current) => current !== perm);
    }

    /**
     * Clean up all of the data in the vault item
     * @protected
     */
    _cleanUp() {
        this._vault = null;
        this._source = null;
    }

    /**
     * Update source references
     * @protected
     */
    _updateRefs() {
        // No-op for vault item
    }
}
