import EventEmitter from "eventemitter3";
import { getDefaultFormat } from "../io/formatRouter.js";
import { findGroupsByTitle } from "../search/groups.js";
import { findEntriesByProperty } from "../search/entries.js";
import { Group } from "./Group.js";
import { Entry } from "./Entry.js";
import { VaultFormat } from "../io/VaultFormat.js";
import { EntryID, GroupID, History } from "../types.js";

/**
 * Vault class - Contains Groups and Entrys
 * @augments EventEmitter
 * @memberof module:Buttercup
 */
export class Vault extends EventEmitter {
    static Attribute = Object.freeze({
        AttachmentsKey: "BC_ATTACHMENTS_KEY"
    });

    /**
     * Create a new archive instance from a list of commands (history)
     * @param history The command list
     * @param format Optional vault format override
     * @returns The vault instance
     * @static
     * @memberof Vault
     */
    static createFromHistory(history: History, format: any = getDefaultFormat()): Vault {
        const vault = new Vault(format);
        vault.format.initialise();
        vault.format.erase();
        vault.format.execute(history);
        vault.format.dirty = false;
        if (!vault.id) {
            vault.format.generateID();
        }
        return vault;
    }

    /**
     * Create a Vault with the default template
     * @param format Optional vault format override
     * @returns The new vault
     * @memberof Vault
     * @static
     */
    static createWithDefaults(format: any = getDefaultFormat()): Vault {
        const vault = new Vault(format);
        vault.createGroup("General");
        vault.createGroup("Trash").setAttribute(Group.Attribute.Role, "trash");
        return vault;
    }

    _entries: Array<Entry> = [];

    _format: VaultFormat;

    _groups: Array<Group> = [];

    _onCommandExec: () => void;

    _tagMap: Map<string, Array<EntryID>> = new Map();

    /**
     * The vault format
     * @readonly
     * @memberof Vault
     */
    get format(): any {
        return this._format;
    }

    /**
     * The ID of the Vault
     * @readonly
     * @memberof Vault
     */
    get id(): string {
        return this.format.getVaultID();
    }

    /**
     * Whether the Vault is in read-only mode
     *  or not
     * @readonly
     * @memberof Vault
     */
    get readOnly(): boolean {
        return this.format.readOnly;
    }

    /**
     * Create a new Vault instance
     * @param Format Optional vault format specification.
     *  Will use the default system format (recommended) if not
     *  specified.
     */
    constructor(format: any = getDefaultFormat()) {
        super();
        // Setup format
        if (format instanceof VaultFormat) {
            this._updateFormat(format);
        } else {
            const Format = format;
            this._updateFormat(new Format());
            this.format.initialise();
        }
        // Create groups and entries
        this._rebuild();
    }

    /**
     * Create a new group
     * @param title The title for the group
     * @returns The newly created group
     * @memberof Vault
     */
    createGroup(title: string): Group {
        const group = Group.createNew(this);
        if (title) {
            group.setTitle(title);
        }
        return group;
    }

    /**
     * Delete an attribute
     * @param attribute The name of the attribute to delete
     * @returns Self
     * @memberof Vault
     */
    deleteAttribute(attribute: string): this {
        this.format.deleteVaultAttribute(attribute);
        return this;
    }

    /**
     * Remove all entries and groups from the trash (permanent)
     * - does nothing if no trash group
     * @returns Self
     * @memberof Vault
     */
    emptyTrash(): this {
        const trash = this.getTrashGroup();
        if (!trash) return;
        trash.getGroups().forEach((group) => {
            group.delete(/* skip trash */ true);
        });
        trash.getEntries().forEach((entry) => {
            entry.delete(/* skip trash */ true);
        });
        return this;
    }

    /**
     * Find an entry by its ID
     * @param id The ID to search for
     * @returns Null if not found, or the Entry instance
     * @memberof Vault
     */
    findEntryByID(id: EntryID): null | Entry {
        return this._entries.find((entry) => entry.id === id) || null;
    }

    /**
     * Find all entries that match a certain property
     * @param property The property to search with
     * @param value The value to search for
     * @returns An array of found extries
     * @memberof Vault
     */
    findEntriesByProperty(property: string | RegExp, value: string | RegExp): Array<Entry> {
        return findEntriesByProperty(this._entries, property, value);
    }

    /**
     * Find entries by a certain tag
     * @param tag The case-insensitive tag name
     * @param exact Whether to match exact tag names or use partial
     *  matching. Default is true (exact).
     * @returns An array of entries
     */
    findEntriesByTag(tag: string, exact: boolean = true): Array<Entry> {
        const tagLower = tag.toLowerCase();
        if (!exact) {
            const entryIDs = new Set<string>();
            for (const [currentTag, currentIDs] of this._tagMap.entries()) {
                if (currentTag.toLowerCase().indexOf(tagLower) === 0) {
                    for (const id of currentIDs) {
                        entryIDs.add(id);
                    }
                }
            }
            return [...entryIDs].map((id) => this.findEntryByID(id));
        }
        const entryIDs = this._tagMap.has(tagLower) ? this._tagMap.get(tagLower) : [];
        console.log("SEARCHING", entryIDs, this._tagMap);
        return entryIDs.map((id) => this.findEntryByID(id));
    }

    /**
     * Find a group by its ID
     * @param id The group ID to search for
     * @returns The group or null if not found
     * @memberof Vault
     */
    findGroupByID(id: GroupID): null | Group {
        return this._groups.find((group) => group.id === id) || null;
    }

    /**
     * Find groups by their title
     * @param title The group title
     * @returns An array of groups
     * @memberof Vault
     */
    findGroupsByTitle(title: string | RegExp): Array<Group> {
        return findGroupsByTitle(this._groups, title);
    }

    /**
     * Get all entries in the vault
     * @returns An array of entry instances
     * @memberof Vault
     */
    getAllEntries(): Array<Entry> {
        return [...this._entries];
    }

    /**
     * Get al groups in the vault
     * @returns An array of group instances
     * @memberof Vault
     */
    getAllGroups(): Array<Group> {
        return [...this._groups];
    }

    /**
     * Get all registered entry tags
     * @returns An array of tag strings
     */
    getAllTags(): Array<string> {
        return [...this._tagMap.keys()];
    }

    /**
     * Get the value of an attribute
     * @param attributeName The attribute to get
     * @returns The value of the attribute or undefined if not
     *  set. Returns an object if no attribute name is given.
     * @memberof Vault
     */
    getAttribute(attributeName?: string): undefined | string | Object {
        const attributes = this.format.getVaultAttributes();
        if (!attributeName) {
            return Object.assign({}, attributes);
        }
        if (attributes.hasOwnProperty(attributeName)) {
            return attributes[attributeName];
        }
        return undefined;
    }

    /**
     * Get the top-level groups in the vault
     * @memberof Vault
     */
    getGroups(): Array<Group> {
        return this._groups.filter((group) => group.getParentGroup() === null);
    }

    /**
     * Get the trash group
     * @returns The trash group or null if it doesn't
     *  exist
     * @memberof Vault
     */
    getTrashGroup(): Group | null {
        const trashGroup = this.getGroups().find((group) => group.isTrash());
        return trashGroup || null;
    }

    /**
     * Set an attribute on the vault
     * @param attribute The attribute to set
     * @param value The value to set for the attribute
     * @returns Self
     * @memberof Vault
     */
    setAttribute(attribute: string, value: string): this {
        this.format.setVaultAttribute(attribute, value);
        return this;
    }

    _rebuild(clear: boolean = false) {
        if (clear) {
            this._groups = [];
            this._entries = [];
        }
        this.format.getAllGroups().forEach((rawGroup) => {
            const id = this.format.getItemID(rawGroup);
            if (!this._groups.find((g) => g.id === id)) {
                this._groups.push(new Group(this, rawGroup));
            }
        });
        this.format.getAllEntries().forEach((rawEntry) => {
            const id = this.format.getItemID(rawEntry);
            if (!this._entries.find((e) => e.id === id)) {
                this._entries.push(new Entry(this, rawEntry));
            }
        });
        this._rebuildTags();
    }

    _rebuildTags() {
        this._tagMap = new Map();
        this.getAllEntries().forEach((entry) => {
            const tags = entry.getTags();
            for (const tag of tags) {
                const tagLower = tag.toLowerCase();
                const existingIDs = this._tagMap.has(tagLower)
                    ? [...this._tagMap.get(tagLower)]
                    : [];
                if (!existingIDs.includes(entry.id)) {
                    existingIDs.push(entry.id);
                }
                this._tagMap.set(tagLower, existingIDs);
            }
        });
    }

    /**
     * Update the format reference
     * @param format The new format instance
     * @memberof Vault
     * @protected
     */
    _updateFormat(format: any) {
        if (this._format) {
            this._format.removeAllListeners();
        }
        this._format = format;
        this._groups.forEach((group) => {
            group._updateRefs();
        });
        this._entries.forEach((entry) => {
            entry._updateRefs();
        });
        this._rebuild();
        this.format.on("commandsExecuted", () => {
            this._rebuild();
            this.emit("vaultUpdated");
        });
        this.format.on("erased", () => {
            this._rebuild(/* clear all: */ true);
            this.emit("vaultUpdated");
        });
    }
}
