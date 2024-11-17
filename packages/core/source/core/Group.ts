import { VaultItem } from "./VaultItem.js";
import { Entry } from "./Entry.js";
import { Vault } from "./Vault.js";
import { generateUUID } from "../tools/uuid.js";
import { moveGroupBetweenVaults } from "../tools/sharing.js";
import { findGroupsByTitle, getAllChildGroups } from "../search/groups.js";
import { findEntriesByProperty, getAllChildEntries } from "../search/entries.js";
import { EntryID, GroupID } from "../types.js";

/**
 * Group class - contains Entrys
 * @augments VaultItem
 * @memberof module:Buttercup
 */
export class Group extends VaultItem {
    static Attribute = Object.freeze({
        Role: "bc_group_role"
    });

    /**
     * Create a new Group instance within a vault and maybe a group
     * @param vault The vault to add the group to
     * @param parentID Optional parent group ID. If no
     *  value is specified the group is added to the root of the
     *  vault.
     * @returns
     * @memberof Group
     * @static
     */
    static createNew(vault: Vault, parentID: GroupID = "0", id: GroupID = generateUUID()): Group {
        if (parentID !== "0") {
            // check if group is trash/in-trash
            const group = vault.findGroupByID(parentID);
            if (!group) {
                throw new Error(`Failed creating group: no group found for ID: ${parentID}`);
            } else if (group.isTrash() || group.isInTrash()) {
                throw new Error("Failed creating group: cannot create within Trash group");
            }
        }
        vault.format.createGroup(parentID, id);
        vault._rebuild();
        return vault.findGroupByID(id);
    }

    /**
     * Create a new entry with a title
     * @param title The title of the new entry
     * @returns The new entry
     * @memberof Group
     */
    createEntry(title?: string): Entry {
        const entry = Entry.createNew(this.vault, this.id);
        if (title) {
            entry.setProperty("title", title);
        }
        return entry;
    }

    /**
     * Create a child group
     * @param title Optionally set a title
     * @returns The new child group
     * @memberof Group
     */
    createGroup(title?: string): Group {
        const group = Group.createNew(this.vault, this.id);
        if (title) {
            group.setTitle(title);
        }
        return group;
    }

    /**
     * Delete the group
     * If there is a trash group available, the group is moved there. If the group
     * is already in the trash, it is deleted permanently.
     * @param skipTrash Skip the trash
     * @returns True when deleted, false when moved to trash
     * @memberof Group
     */
    delete(skipTrash: boolean = false): boolean {
        if (this.isTrash()) {
            throw new Error("Trash group cannot be deleted");
        }
        const trashGroup = this.vault.getTrashGroup();
        const hasTrash = trashGroup !== null;
        const inTrash = this.isInTrash();
        if (!inTrash && hasTrash && !skipTrash) {
            // Not in trash, and a trash group exists, so move it there
            this.moveTo(trashGroup);
            return false;
        }
        // No trash or already in trash, so just delete:
        //  - Child groups
        this.getGroups().forEach((group) => group.delete(/* skip trash: */ true));
        //  - Child entries
        this.getEntries().forEach((entry) => entry.delete(/* skip trash: */ true));
        //  - This group
        this.vault.format.deleteGroup(this.id);
        const ind = this.vault._groups.indexOf(this);
        if (ind >= 0) {
            this.vault._groups.splice(ind, 1);
        }
        this._cleanUp();
        return true;
    }

    /**
     * Delete an attribute
     * @param attr The name of the attribute
     * @returns Returns self
     * @memberof Group
     */
    deleteAttribute(attr: string): this {
        this.vault.format.deleteGroupAttribute(this.id, attr);
        return this;
    }

    /**
     * Find an entry by its ID
     * @param id The ID to search for
     * @returns Null if not found, or the Entry instance
     * @memberof Group
     */
    findEntryByID(id: EntryID): Entry | null {
        return (
            getAllChildEntries(this.vault._entries, this.id).find((entry) => entry.id === id) ||
            null
        );
    }

    /**
     * Find all entries that match a certain property
     * @name findEntriesByProperty
     * @param property The property to search with
     * @param value The value to search for
     * @returns An array of found extries
     * @memberof Group
     */
    findEntriesByProperty(property: RegExp | string, value: RegExp | string): Array<Entry> {
        return findEntriesByProperty(
            getAllChildEntries(this.vault._entries, this.id),
            property,
            value
        );
    }

    /**
     * Find a group by its ID
     * @param id The group ID to search for
     * @returns The group or null if not found
     * @memberof Group
     */
    findGroupByID(id: GroupID): Group | null {
        return (
            getAllChildGroups(this.vault._groups, this.id).find((group) => group.id === id) || null
        );
    }

    /**
     * Find groups by their title
     * @name findGroupsByTitle
     * @param title The group title
     * @returns An array of groups
     * @memberof Group
     */
    findGroupsByTitle(title: RegExp | string): Array<Group> {
        return findGroupsByTitle(getAllChildGroups(this.vault._groups, this.id), title);
    }

    /**
     * Get an attribute
     * @param attribute The name of the attribute. If none provided
     *  the entire attributes object is returned.
     * @returns Returns the attribute or undefined if not found.
     *  If no attribute name is provided an object containing all attributes is returned.
     * @memberof Group
     */
    getAttribute(attribute?: string): Object | string | undefined {
        const attributes = this.vault.format.getGroupAttributes(this._source) || {};
        if (typeof attribute === "undefined") {
            return Object.assign({}, attributes);
        }
        return attributes.hasOwnProperty(attribute) ? attributes[attribute] : undefined;
    }

    /**
     * Get the entries within the group
     * @returns An array of entries
     * @memberof Group
     */
    getEntries(): Array<Entry> {
        return this.vault._entries.filter((entry) => entry.getGroup() === this);
    }

    /**
     * Get the groups within the group
     * @returns An array of child groups
     * @memberof Group
     */
    getGroups(): Array<Group> {
        return this.vault._groups.filter((group) => group.getParentGroup() === this);
    }

    /**
     * Get the parent group
     * @returns Returns the parent group instance or null if the parent
     *  is the archive
     * @throws {Error} Throws if no parent could be found (detached)
     * @memberof Group
     */
    getParentGroup(): Group | null {
        const parentID = this.vault.format.getItemParentID(this._source);
        if (parentID === "0") return null;
        const parentGroup = this.vault._groups.find((g) => g.id === parentID);
        if (!parentGroup) {
            throw new Error(
                `Failed getting parent Group: No group containing child ID found: ${this.id}`
            );
        }
        return parentGroup;
    }

    /**
     * Get the group title
     * @returns The title of the group
     * @memberof Group
     */
    getTitle(): string {
        return this.vault.format.getGroupTitle(this._source);
    }

    /**
     * Check if the group is in the trash
     * @returns Whether or not the group is within the trash group
     * @memberof Group
     */
    isInTrash(): boolean {
        const trash = this.vault.getTrashGroup();
        if (trash) {
            const thisGroup = trash.findGroupByID(this.id);
            return thisGroup !== null;
        }
        return false;
    }

    /**
     * Check if the group is used for trash
     * @returns Whether or not the group is the trash group
     * @memberof Group
     */
    isTrash(): boolean {
        return this.getAttribute(Group.Attribute.Role) === "trash";
    }

    /**
     * Move the group to another group or archive
     * @param target The destination Group or Vault instance
     * @returns Self
     * @memberof Group
     */
    moveTo(target: Group | Vault): this {
        if (this.isTrash()) {
            throw new Error("Trash group cannot be moved");
        }
        let targetVault, targetGroupID;
        if (target instanceof Group) {
            // moving to a group
            targetVault = target.vault;
            targetGroupID = target.id;
        } else if (target instanceof Vault) {
            // moving to an archive
            targetVault = target;
            targetGroupID = "0";
        } else {
            throw new Error("Failed moving group: Unknown target type");
        }
        if (this.vault.readOnly) {
            throw new Error("Cannot move group: origin archive is read-only");
        }
        if (targetVault.readOnly) {
            throw new Error("Cannot move group: target archive is read-only");
        }
        if (target instanceof Group && !!this.findGroupByID(target.id)) {
            // Target is a child of this group, so we can't move to it as
            // it'd become circular.
            throw new Error("Cannot move group: target group is a child of the current group");
        }
        if (this.vault.id === targetVault.id) {
            // target is local, so create commands here
            this.vault.format.moveGroup(this.id, targetGroupID);
        } else {
            // target is in another archive, so move there
            moveGroupBetweenVaults(this, target);
        }
        return this;
    }

    /**
     * Set an attribute
     * @param attribute The name of the attribute
     * @param value The value to set
     * @returns Returns self
     * @memberof Group
     */
    setAttribute(attribute: string, value: string): this {
        this.vault.format.setGroupAttribute(this.id, attribute, value);
        return this;
    }

    /**
     * Set the group title
     * @param title The title of the group
     * @returns Returns self
     */
    setTitle(title: string): this {
        this.vault.format.setGroupTitle(this.id, title);
        return this;
    }

    _updateRefs() {
        this._source = this.vault.format.findGroupByID(this.id);
    }
}
