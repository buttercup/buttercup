import { consumeEntryFacade, createEntryFacade } from "./entry.js";
import { idSignifiesNew } from "./tools.js";
import { FACADE_VERSION } from "./symbols.js";
import { Entry } from "../core/Entry.js";
import { Group } from "../core/Group.js";
import { Vault } from "../core/Vault.js";
import { generateUUID } from "../tools/uuid.js";
import { EntryFacade, GroupFacade, GroupID, VaultFacade } from "../types.js";

export interface ConsumeVaultFacadeOptions {
    mergeMode?: boolean;
}

export interface CreateVaultFacadeOptions {
    includeTrash?: boolean;
}

export interface GetGroupEntriesFacadesOptions {
    includeTrash?: boolean;
}

export interface GetGroupsFacadesOptions {
    includeTrash?: boolean;
}

const { FacadeType } = Entry.Attributes;

/**
 * Consume a group facade and apply the differences to a group instance
 * @param group The group instance to apply to
 * @param facade The facade to apply
 * @memberof module:Buttercup
 */
export function consumeGroupFacade(group: Group, facade: GroupFacade) {
    const { id, title, type, attributes } = facade;
    const existingAttributes = group.getAttribute();
    if (type !== "group") {
        throw new Error(`Failed consuming group facade: Invalid facade type: ${type}`);
    }
    if (id !== group.id) {
        throw new Error(
            `Failed consuming group facade: Provided facade ID (${id}) does not match target group's ID: ${group.id}`
        );
    }
    if (!title || title.trim().length <= 0) {
        throw new Error("Failed consuming group facade: Title must not be empty");
    }
    if (group.getTitle() !== title) {
        group.setTitle(title);
    }
    // Check attributes
    Object.keys(existingAttributes)
        .filter((attr) => !attributes.hasOwnProperty(attr))
        .forEach((attr) => {
            // Remove missing
            group.deleteAttribute(attr);
        });
    Object.keys(attributes).forEach((attr) => {
        if (!existingAttributes[attr] || existingAttributes[attr] !== attributes[attr]) {
            // Different value
            group.setAttribute(attr, attributes[attr]);
        }
    });
}

/**
 * Consume a vault facade and apply the differences to the vault
 * instance
 * @param vault The vault instance to apply to
 * @param facade The facade to apply
 * @param options Options for the consumption
 * @memberof module:Buttercup
 */
export function consumeVaultFacade(
    vault: Vault,
    facade: VaultFacade,
    options: ConsumeVaultFacadeOptions = {}
) {
    if (facade._ver !== FACADE_VERSION) {
        throw new Error("Invalid vault facade version");
    }
    if (!facade || (facade && facade.type !== "vault")) {
        throw new Error(
            `Failed consuming vault facade: Second parameter expected to be a vault facade, got: ${facade.type}`
        );
    }
    const { mergeMode = false } = options;
    const { id, type, attributes, groups, entries } = facade;
    if (type !== "vault") {
        throw new Error(`Failed consuming vault facade: Invalid facade type: ${type}`);
    }
    if (!mergeMode && id !== vault.id) {
        throw new Error(
            `Failed consuming vault facade: Provided facade ID (${id}) does not match target vault ID: ${vault.id}`
        );
    }
    const newIDLookup = {};
    // Create comparison facade
    let {
        groups: currentGroups,
        entries: currentEntries,
        attributes: currentAttributes
    } = createVaultFacade(vault);
    // Handle group removal
    if (!mergeMode) {
        currentGroups.forEach((currentGroupFacade) => {
            const existing = groups.find((group) => group.id === currentGroupFacade.id);
            if (!existing) {
                // Removed, so delete
                const targetItem = vault.findGroupByID(currentGroupFacade.id);
                if (targetItem) {
                    // Only attempt deleting if it comes back as a result. It's possible
                    // that if a parent was deleted, the children were also removed and
                    // this call to `findGroupByID` might return nothing..
                    targetItem.delete();
                }
            }
        });
    }
    // Update facade properties after groups deletion
    currentGroups = getGroupsFacades(vault);
    // Manage other group operations
    let groupsLeft = [...groups];
    while (groupsLeft.length > 0) {
        let originalLength = groupsLeft.length;
        groupsLeft = groupsLeft.filter((groupRaw) => {
            const groupFacade = Object.assign({}, groupRaw);
            const groupIDTargetedNew = idSignifiesNew(groupFacade.id, mergeMode);
            if (!groupFacade.id || groupIDTargetedNew) {
                let targetParentID = groupFacade.parentID;
                if (idSignifiesNew(targetParentID, mergeMode)) {
                    if (newIDLookup[targetParentID]) {
                        targetParentID = newIDLookup[targetParentID];
                    } else {
                        // No parent created yet, stalled
                        return true; // keep in loop - not ready
                    }
                }
                // Handle group addition
                const targetParent =
                    targetParentID === "0" ? vault : vault.findGroupByID(targetParentID);
                const newGroupInst = targetParent.createGroup(groupFacade.title);
                if (groupIDTargetedNew) {
                    newIDLookup[`${groupFacade.id}`] = newGroupInst.id;
                }
                groupFacade.id = newGroupInst.id;
            } else {
                if (!currentGroups.find((group) => group.id === groupFacade.id)) {
                    // Group had an ID which is now gone, so it was removed
                    return;
                }
                // Handle group move
                const { id: groupID, parentID: groupParentID } = groupFacade;
                const ref = vault.findGroupByID(groupID);
                const refGroup = ref.getParentGroup();
                if (
                    (refGroup === null && groupParentID !== "0") ||
                    (refGroup !== null && refGroup.id !== groupParentID)
                ) {
                    // Group has different parent, so move
                    ref.moveTo(groupParentID === "0" ? vault : vault.findGroupByID(groupParentID));
                }
            }
            consumeGroupFacade(vault.findGroupByID(groupFacade.id), groupFacade);
            return false; // remove from loop - done
        });
        if (originalLength === groupsLeft.length) {
            const ids = groupsLeft.map((group) => group.id);
            throw new Error(`Processing facade stalled: groups not resolveable: ${ids.join(", ")}`);
        }
    }
    // Handle entry removal
    if (!mergeMode) {
        currentEntries.forEach((currentEntryFacade) => {
            const existing = entries.find((entry) => entry.id === currentEntryFacade.id);
            if (!existing) {
                // Removed, so delete
                const entry = vault.findEntryByID(currentEntryFacade.id);
                if (entry) {
                    entry.delete();
                }
            }
        });
    }
    // Update facade properties after entries deletion
    currentEntries = getEntriesFacades(vault);
    // Manage other entry operations
    let entriesLeft = [...entries];
    entriesLeft = entriesLeft.filter((entryRaw) => {
        const entryFacade = Object.assign({}, entryRaw);
        const entryIDTargetedNew = idSignifiesNew(entryFacade.id, mergeMode);
        if (!entryFacade.id || entryIDTargetedNew) {
            let targetGroupID = entryFacade.parentID;
            if (idSignifiesNew(targetGroupID, mergeMode)) {
                if (newIDLookup[targetGroupID]) {
                    targetGroupID = newIDLookup[targetGroupID];
                } else {
                    // No parent created yet, stalled
                    return true; // keep in loop - not ready
                }
            }
            // Handle entry addition
            const targetGroup = vault.findGroupByID(targetGroupID);
            const newEntry = targetGroup.createEntry();
            if (entryIDTargetedNew) {
                // Not used at the moment, but if references towards
                // entries are needed later, this provides the lookup
                newIDLookup[`${entryFacade.id}`] = newEntry.id;
            }
            entryFacade.id = newEntry.id;
            if (entryFacade.type) {
                newEntry.setAttribute(FacadeType, entryFacade.type);
            }
        } else {
            if (!currentEntries.find((entry) => entry.id === entryRaw.id)) {
                // Entry had an ID which is now gone, so it was removed
                return;
            }
            // Handle entry move
            const ref = vault.findEntryByID(entryFacade.id);
            const refGroup = ref.getGroup();
            if (refGroup.id !== entryFacade.parentID) {
                // Entry has different group, so move
                ref.moveToGroup(vault.findGroupByID(entryFacade.parentID));
            }
        }
        const entryToUpdate = vault.findEntryByID(entryFacade.id);
        consumeEntryFacade(entryToUpdate, entryFacade);
        return false; // done - remove
    });
    // Check attributes
    Object.keys(currentAttributes)
        .filter((attr) => !attributes.hasOwnProperty(attr))
        .forEach((attr) => {
            // Remove missing
            vault.deleteAttribute(attr);
        });
    Object.keys(attributes).forEach((attr) => {
        // Skip this attribute if it's the attachments key
        if (attr === Vault.Attribute.AttachmentsKey && mergeMode) return;
        if (!currentAttributes[attr] || currentAttributes[attr] !== attributes[attr]) {
            // Different value
            vault.setAttribute(attr, attributes[attr]);
        }
    });
}

/**
 * Create a vault facade from an Vault instance
 * @param vault A vault instance
 * @returns A vault facade
 * @memberof module:Buttercup
 */
export function createVaultFacade(
    vault: Vault,
    options: CreateVaultFacadeOptions = {}
): VaultFacade {
    const { includeTrash = true } = options;
    return {
        _tag: generateUUID(),
        _ver: FACADE_VERSION,
        type: "vault",
        id: vault.id,
        attributes: vault.getAttribute() as { [key: string]: string },
        groups: getGroupsFacades(vault, { includeTrash }),
        entries: getEntriesFacades(vault, { includeTrash })
    };
}

/**
 * Create a group facade from a Group instance
 * @param group The group instance
 * @param parentID The parent ID of the group
 * @memberof module:Buttercup
 */
export function createGroupFacade(group: Group | null, parentID: GroupID = "0"): GroupFacade {
    return {
        type: "group",
        id: group ? group.id : null,
        title: group ? group.getTitle() : "",
        attributes: group ? (group.getAttribute() as { [key: string]: string }) : {},
        parentID
    };
}

/**
 * Get all entry facades for a vault
 * @param vault A vault instance
 * @param options Options for getting entry facades
 * @returns An array of entry facades
 */
function getEntriesFacades(vault: Vault, options: GetGroupEntriesFacadesOptions = {}) {
    return vault
        .getGroups()
        .reduce((output, group) => [...output, ...getGroupEntriesFacades(group, options)], []);
}

/**
 * Convert a group of entries into an array of facades
 * @param entryCollection A group instance
 * @param options Options for getting entry facades
 * @returns An array of entry facades
 */
function getGroupEntriesFacades(
    entryCollection: Group,
    options: GetGroupEntriesFacadesOptions = {}
): Array<EntryFacade> {
    const { includeTrash = true } = options;
    const facades = entryCollection.getEntries().reduce((facades, entry) => {
        if (includeTrash === false && entry.isInTrash()) {
            return facades;
        }
        return [...facades, Object.assign({}, createEntryFacade(entry))];
    }, []);
    entryCollection.getGroups().forEach((group) => {
        facades.push(...getGroupEntriesFacades(group, options));
    });
    return facades;
}

/**
 * Convert an array of groups into an array of facades
 * @param vault The vault instance
 * @param options Options for getting group facades
 * @returns An array of group facades
 */
function getGroupsFacades(vault: Vault, options: GetGroupsFacadesOptions = {}): Array<GroupFacade> {
    const { includeTrash = true } = options;
    return vault._groups.reduce((output, group) => {
        if (includeTrash === false && (group.isTrash() || group.isInTrash())) {
            return output;
        }
        return [
            ...output,
            createGroupFacade(group, group.vault.format.getItemParentID(group._source))
        ];
    }, []);
}
