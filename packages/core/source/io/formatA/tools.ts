import { encodeStringValue } from "../../tools/encoding.js";
import { generateUUID } from "../../tools/uuid.js";
import {
    EntryLegacyHistoryItem,
    EntryID,
    EntryPropertyType,
    FormatAEntry,
    FormatAGroup,
    FormatAVault,
    GroupID
} from "../../types.js";

interface FormatACommandArgument {
    test: RegExp;
    wrap: (text: string) => string;
    encode: boolean;
}

interface FormatACommandArguments {
    [key: string]: FormatACommandArgument;
}

interface FormatACommandManifestCommand {
    s: string; // The command
    d: boolean; // Destructive flag
    args: Array<FormatACommandArgument>; // Command argument definitions
}

interface FormatACommandManifestCommands {
    [key: string]: FormatACommandManifestCommand;
}

export const COMMAND_ARGUMENT: FormatACommandArguments = {
    ItemID: {
        test: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
        wrap: (text: string) => text,
        encode: false
    },
    ItemIDOrRoot: {
        test: /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|0)$/i,
        wrap: (text: string) => text,
        encode: false
    },
    StringKey: {
        test: /\S+/,
        wrap: (txt: string) => encodeStringValue(txt),
        encode: true
    },
    StringValue: {
        test: /(^[\s\S]+$|^$)/,
        wrap: (txt: string) => encodeStringValue(txt),
        encode: true
    }
};
const ARG = COMMAND_ARGUMENT;
export const COMMAND_MANIFEST: FormatACommandManifestCommands = {
    ArchiveID: { s: "aid", d: false, args: [ARG.ItemID] },
    Comment: { s: "cmm", d: false, args: [ARG.StringValue] },
    CreateEntry: { s: "cen", d: false, args: [ARG.ItemID, ARG.ItemID] },
    CreateGroup: { s: "cgr", d: false, args: [ARG.ItemIDOrRoot, ARG.ItemID] },
    DeleteArchiveAttribute: { s: "daa", d: true, args: [ARG.StringValue] },
    DeleteEntry: { s: "den", d: true, args: [ARG.ItemID] },
    DeleteEntryAttribute: { s: "dea", d: true, args: [ARG.ItemID, ARG.StringValue] },
    DeleteEntryMeta: { s: "dem", d: true, args: [ARG.ItemID, ARG.StringValue] },
    DeleteEntryProperty: { s: "dep", d: true, args: [ARG.ItemID, ARG.StringValue] },
    DeleteGroup: { s: "dgr", d: true, args: [ARG.ItemID] },
    DeleteGroupAttribute: { s: "dga", d: true, args: [ARG.ItemID, ARG.StringValue] },
    Format: { s: "fmt", d: false, args: [ARG.StringValue] },
    MoveEntry: { s: "men", d: false, args: [ARG.ItemID, ARG.ItemID] },
    MoveGroup: { s: "mgr", d: false, args: [ARG.ItemID, ARG.ItemIDOrRoot] },
    Pad: { s: "pad", d: false, args: [ARG.ItemID] },
    SetArchiveAttribute: { s: "saa", d: false, args: [ARG.StringValue, ARG.StringValue] },
    SetEntryAttribute: { s: "sea", d: false, args: [ARG.ItemID, ARG.StringValue, ARG.StringValue] },
    SetEntryMeta: { s: "sem", d: false, args: [ARG.ItemID, ARG.StringValue, ARG.StringValue] },
    SetEntryProperty: { s: "sep", d: false, args: [ARG.ItemID, ARG.StringKey, ARG.StringValue] },
    SetGroupAttribute: { s: "sga", d: false, args: [ARG.ItemID, ARG.StringValue, ARG.StringValue] },
    SetGroupTitle: { s: "tgr", d: false, args: [ARG.ItemID, ARG.StringValue] }
};
const PLACEHOLDER_ESCAPED = "__ESCAPED_QUOTE__";
const PLACEHOLDER_QUOTED = "__QUOTEDSTR__";

export class InigoCommand {
    static Command = COMMAND_MANIFEST;

    static create(cmd: FormatACommandManifestCommand) {
        return new InigoCommand(cmd);
    }

    static generatePaddingCommand(): string {
        const inigo = InigoCommand.create(COMMAND_MANIFEST.Pad);
        return inigo.addArgument(generateUUID()).generateCommand();
    }

    _commandKey: FormatACommandManifestCommand;
    _commandArgs: Array<string>;

    constructor(cmdKey: FormatACommandManifestCommand) {
        this._commandKey = cmdKey;
        this._commandArgs = [];
    }

    addArgument(arg: string): this {
        const newArgIndex = this._commandArgs.length;
        const argRules = this._commandKey.args;
        const newArgRule = argRules.length <= newArgIndex ? false : argRules[newArgIndex];
        if (newArgRule === false) {
            throw new Error(
                `Failed adding argument for command "${this._commandKey.s}": too many arguments`
            );
        }
        if (!newArgRule.test.test(arg)) {
            throw new Error(
                `Failed adding argument for command "${this._commandKey.s}": argument ${newArgIndex} is of invalid format`
            );
        }
        this._commandArgs.push(newArgRule.wrap(arg));
        return this;
    }

    generateCommand(): string {
        return [this._commandKey.s].concat(this._commandArgs).join(" ");
    }
}

/**
 * Extract command components from a string
 * @param command The command to extract from
 * @returns The separated parts
 */
export function extractCommandComponents(cmd: string): Array<string> {
    const patt = /("[^"]*")/;
    const matches: Array<string> = [];
    let match: RegExpExecArray;
    let command = cmd.replace(/\\\"/g, PLACEHOLDER_ESCAPED);
    // Replace complex command segments
    while ((match = patt.exec(command))) {
        const [matched] = match;
        command =
            command.substr(0, match.index) +
            PLACEHOLDER_QUOTED +
            command.substr(match.index + matched.length);
        matches.push(matched.substring(1, matched.length - 1));
    }
    // Split command, map back to original values
    return command.split(" ").map((part) => {
        let item = part.trim();
        if (item === PLACEHOLDER_QUOTED) {
            item = matches.shift();
        }
        item = item.replace(new RegExp(PLACEHOLDER_ESCAPED, "g"), '"');
        return item;
    });
}

export function findEntryByID(groups: Array<FormatAGroup>, id: EntryID) {
    for (let i = 0, groupsLen = groups.length; i < groupsLen; i += 1) {
        const group = groups[i];
        if (group.entries) {
            for (let j = 0, entriesLen = group.entries.length; j < entriesLen; j += 1) {
                if (group.entries[j].id === id) {
                    return group.entries[j];
                }
            }
        }
        if (group.groups) {
            const deepEntry = findEntryByID(group.groups, id);
            if (deepEntry) {
                return deepEntry;
            }
        }
    }
    return null;
}

function findGroupByCheck(groups, checkFn) {
    for (let i = 0, groupsLen = groups.length; i < groupsLen; i += 1) {
        if (checkFn(groups[i]) === true) {
            return groups[i];
        }
        if (groups[i].groups) {
            const deepGroup = findGroupByCheck(groups[i].groups, checkFn);
            if (deepGroup) {
                return deepGroup;
            }
        }
    }
    return null;
}

export function findGroupByID(groups, id) {
    return findGroupByCheck(groups, function (group) {
        return group.id === id;
    });
}

/**
 * Find a raw group that contains an entry with an ID
 * @param groups An array of raw groups
 * @param id The entry ID to search for
 * @returns The parent group of the found entry
 */
export function findGroupContainingEntryID(groups: Array<FormatAGroup>, id: EntryID) {
    for (let i = 0, groupsLen = groups.length; i < groupsLen; i += 1) {
        const group = groups[i];
        if (group.entries) {
            for (var j = 0, entriesLen = group.entries.length; j < entriesLen; j += 1) {
                if (group.entries[j].id === id) {
                    return {
                        group: group,
                        index: j
                    };
                }
            }
        }
        if (group.groups) {
            const deepGroup = findGroupContainingEntryID(group.groups, id);
            if (deepGroup.group) {
                return deepGroup;
            }
        }
    }
    return {
        group: null,
        index: null
    };
}

/**
 * Find a raw group that contains a group with an ID
 * @param group The group/archive to search in
 * @param id The group ID to search for
 * @returns The parent of the located group ID
 */
export function findGroupContainingGroupID(group: FormatAGroup | FormatAVault, id: GroupID) {
    const groups = group.groups || [];
    for (let i = 0, groupsLen = groups.length; i < groupsLen; i += 1) {
        if (groups[i].id === id) {
            return {
                group: group,
                index: i
            };
        }
        const deepGroup = findGroupContainingGroupID(groups[i], id);
        if (deepGroup.group) {
            return deepGroup;
        }
    }
    return {
        group: null,
        index: null
    };
}

/**
 * @typedef {Object} EntryLegacyHistoryItem
 * @property {String} property The property/attribute name
 * @property {String} propertyType Either "property" or "attribute"
 * @property {String|null} originalValue The original value or null if it did not exist
 *  before this change
 * @property {String|null} newValue The new value or null if it was deleted
 */

/**
 * Generate a new entry history item
 * @param property The property/attribute name
 * @param propertyType Either "property" or "attribute"
 * @param originalValue The original value or null if it did not exist
 *  before this change
 * @param newValue The new value or null if it was deleted
 */
export function generateEntryLegacyHistoryItem(
    property: string,
    propertyType: EntryPropertyType,
    originalValue: string = null,
    newValue: string = null
): EntryLegacyHistoryItem {
    return Object.freeze({
        property,
        propertyType,
        originalValue,
        newValue
    });
}

export function getAllEntries(source: FormatAVault, parentID: GroupID = null): Array<FormatAEntry> {
    const entries = [];
    const getEntries = (group: FormatAGroup) => {
        if (parentID === null || group.id === parentID) {
            entries.push(...(group.entries || []));
        }
        (group.groups || []).forEach((group) => getEntries(group));
    };
    source.groups.forEach((group) => getEntries(group));
    return entries;
}

export function getAllGroups(source: FormatAVault, parentID: GroupID = null): Array<FormatAGroup> {
    const foundGroups = [];
    const getGroups = (parent: FormatAVault | FormatAGroup) => {
        (parent.groups || []).forEach((subGroup) => {
            if (
                parentID === null ||
                (parentID === "0" && typeof (<any>subGroup).parentID === "undefined") ||
                parentID === (<FormatAGroup>subGroup).parentID
            ) {
                foundGroups.push(subGroup);
            }
            getGroups(subGroup);
        });
    };
    getGroups(source);
    return foundGroups;
}

export function historyArrayToString(historyArray: Array<string>): string {
    return historyArray.join("\n");
}

export function historyStringToArray(historyString: string): Array<string> {
    return historyString.split("\n");
}
