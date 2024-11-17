import {
    findEntryByID,
    findGroupByID,
    findGroupContainingEntryID,
    findGroupContainingGroupID,
    generateEntryLegacyHistoryItem
} from "./tools.js";
import {
    EntryID,
    EntryPropertyType,
    FormatAEntry,
    FormatAGroup,
    FormatAVault,
    GroupID,
    VaultID
} from "../../types.js";

export function executeArchiveID(vault: FormatAVault, opts: any, id: VaultID) {
    if (opts.shareID) {
        // Don't set vault ID from a share
        return;
    }
    if (vault.id) {
        // ID already set
        throw new Error("Vault ID already set");
    }
    vault.id = id;
}

export function executeComment() {
    // Comment has no action
}

export function executeCreateEntry(
    archive: FormatAVault,
    opts: any,
    groupID: GroupID,
    entryID: EntryID
) {
    archive.groups = archive.groups || [];
    const entry: FormatAEntry = {
        id: entryID,
        properties: {},
        shareID: opts.shareID,
        parentID: groupID
    };
    if (opts.permissions) {
        entry.permissions = opts.permissions;
    }
    const group = findGroupByID(archive.groups, groupID);
    if (!group) {
        throw new Error(`Invalid group ID: ${groupID}`);
    }
    group.entries = group.entries || [];
    group.entries.push(entry);
}

export function executeCreateGroup(
    archive: FormatAVault,
    opts: any,
    parentID: GroupID | VaultID,
    newID: GroupID
) {
    archive.groups = archive.groups || [];
    const group: FormatAGroup = {
        id: newID,
        title: "New group",
        shareID: opts.shareID,
        parentID
    };
    if (opts.permissions) {
        group.permissions = opts.permissions;
    }
    if (parentID === "0") {
        archive.groups.push(group);
    } else {
        const parentGroup = findGroupByID(archive.groups, parentID);
        if (!parentGroup) {
            throw new Error(`Invalid parent group ID: ${parentID}`);
        }
        parentGroup.groups = parentGroup.groups || [];
        parentGroup.groups.push(group);
    }
}

export function executeDeleteArchiveAttribute(archive: FormatAVault, opts: any, attribute: string) {
    const attributes = archive.attributes || {};
    if (attributes.hasOwnProperty(attribute) !== true) {
        throw new Error(`Vault contains no such attribute: ${attribute}`);
    }
    const deleted = delete attributes[attribute];
    if (!deleted) {
        throw new Error(`Failed deleting attribute: ${attribute}`);
    }
}

export function executeDeleteEntry(archive: FormatAVault, opts: any, entryID: EntryID) {
    archive.groups = archive.groups || [];
    const { group, index } = findGroupContainingEntryID(archive.groups, entryID);
    if (!group) {
        throw new Error(`Failed deleting entry: Invalid entry ID: ${entryID}`);
    }
    group.entries.splice(index, 1);
}

export function executeDeleteEntryAttribute(
    archive: FormatAVault,
    opts: any,
    entryID: EntryID,
    attribute: string
) {
    archive.groups = archive.groups || [];
    const entry = findEntryByID(archive.groups, entryID);
    if (!entry) {
        throw new Error("Entry not found for ID");
    }
    entry.attributes = entry.attributes || {};
    const value = entry.attributes[attribute];
    const deleted = delete entry.attributes[attribute];
    if (!deleted) {
        throw new Error("Failed deleting attribute");
    }
    entry.history = entry.history || [];
    entry.history.push(
        generateEntryLegacyHistoryItem(attribute, EntryPropertyType.Attribute, value, null)
    );
}

export function executeDeleteEntryProperty(
    archive: FormatAVault,
    opts: any,
    entryID: EntryID,
    property: string
) {
    archive.groups = archive.groups || [];
    const entry = findEntryByID(archive.groups, entryID);
    if (!entry) {
        throw new Error(`Entry not found for ID: ${entryID}`);
    }
    entry.properties = entry.properties || {};
    const value = entry.properties[property];
    const deleted = delete entry.properties[property];
    if (!deleted) {
        throw new Error(`Failed deleting property: ${property}`);
    }
    entry.history = entry.history || [];
    entry.history.push(
        generateEntryLegacyHistoryItem(property, EntryPropertyType.Property, value, null)
    );
}

export function executeDeleteGroup(archive: FormatAVault, opts: any, groupID: GroupID) {
    archive.groups = archive.groups || [];
    const { group, index } = findGroupContainingGroupID(archive, groupID);
    if (!group) {
        throw new Error(`Invalid group ID: ${groupID}`);
    }
    group.groups.splice(index, 1);
}

export function executeDeleteGroupAttribute(
    archive: FormatAVault,
    opts: any,
    groupID: GroupID,
    attribute: string
) {
    archive.groups = archive.groups || [];
    const group = findGroupByID(archive.groups, groupID);
    if (!group) {
        throw new Error(`Group not found for ID: ${groupID}`);
    }
    group.attributes = group.attributes || {};
    const deleted = delete group.attributes[attribute];
    if (!deleted) {
        throw new Error(`Failed deleting attribute: ${attribute}`);
    }
}

export function executeFormat(archive: FormatAVault, opts: any, format: string) {
    if (opts.shareID) {
        // Don't set archive format from a share
        return;
    }
    if (archive.format) {
        throw new Error("Format already set");
    }
    archive.format = format;
}

export function executeMoveEntry(
    archive: FormatAVault,
    opts: any,
    entryID: EntryID,
    groupID: GroupID
) {
    archive.groups = archive.groups || [];
    const { group: originGroup, index: originIndex } = findGroupContainingEntryID(
        archive.groups,
        entryID
    );
    if (!originGroup) {
        throw new Error(`Invalid entry ID: ${entryID}`);
    }
    const targetGroup = findGroupByID(archive.groups, groupID);
    if (!targetGroup) {
        throw new Error("Invalid group ID");
    }
    const [movedEntry] = originGroup.entries.splice(originIndex, 1);
    targetGroup.entries = targetGroup.entries || [];
    targetGroup.entries.push(movedEntry);
    movedEntry.parentID = groupID;
}

export function executeMoveGroup(
    archive: FormatAVault,
    opts: any,
    groupID: GroupID,
    targetGroupID: GroupID
) {
    archive.groups = archive.groups || [];
    const { group: originGroup, index: originIndex } = findGroupContainingGroupID(archive, groupID);
    if (!originGroup) {
        throw new Error(`Invalid group ID: ${groupID}`);
    }
    const targetGroup =
        targetGroupID.length === 1 && parseInt(targetGroupID, 10) === 0
            ? archive
            : findGroupByID(archive.groups, targetGroupID);
    if (!targetGroup) {
        throw new Error(`Invalid target group ID: ${targetGroupID}`);
    }
    const [movedGroup] = originGroup.groups.splice(originIndex, 1);
    targetGroup.groups = targetGroup.groups || [];
    targetGroup.groups.push(movedGroup);
    movedGroup.parentID = targetGroupID;
}

export function executePad() {
    // Comment has no action
}

export function executeSetArchiveAttribute(
    archive: FormatAVault,
    opts: any,
    attribute: string,
    value: string
) {
    archive.attributes = archive.attributes || {};
    archive.attributes[attribute] = value;
}

export function executeSetEntryAttribute(
    archive: FormatAVault,
    opts: any,
    entryID: EntryID,
    attribute: string,
    value: string
) {
    archive.groups = archive.groups || [];
    const entry = findEntryByID(archive.groups, entryID);
    if (!entry) {
        throw new Error(`Entry not found for ID: ${entryID}`);
    }
    entry.attributes = entry.attributes || {};
    const previousValue =
        typeof entry.attributes[attribute] === "string" ? entry.attributes[attribute] : null;
    entry.attributes[attribute] = value;
    entry.history = entry.history || [];
    entry.history.push(
        generateEntryLegacyHistoryItem(attribute, EntryPropertyType.Attribute, previousValue, value)
    );
}

export function executeSetEntryProperty(
    archive: FormatAVault,
    opts: any,
    entryID: EntryID,
    property: string,
    value: string
) {
    archive.groups = archive.groups || [];
    const entry = findEntryByID(archive.groups, entryID);
    if (!entry) {
        throw new Error(`Entry not found for ID: ${entryID}`);
    }
    entry.properties = entry.properties || {};
    const previousValue =
        typeof entry.properties[property] === "string" ? entry.properties[property] : null;
    entry.properties[property] = value;
    entry.history = entry.history || [];
    entry.history.push(
        generateEntryLegacyHistoryItem(property, EntryPropertyType.Property, previousValue, value)
    );
}

export function executeSetGroupAttribute(
    archive: FormatAVault,
    opts: any,
    groupID: GroupID,
    attribute: string,
    value: string
) {
    archive.groups = archive.groups || [];
    const group = findGroupByID(archive.groups, groupID);
    if (!group) {
        throw new Error(`Group not found for ID: ${groupID}`);
    }
    group.attributes = group.attributes || {};
    group.attributes[attribute] = value;
}

export function executeTitleGroup(
    archive: FormatAVault,
    opts: any,
    groupID: GroupID,
    title: string
) {
    archive.groups = archive.groups || [];
    const group = findGroupByID(archive.groups, groupID);
    if (!group) {
        throw new Error(`Group not found for ID: ${groupID}`);
    }
    group.title = title;
}
