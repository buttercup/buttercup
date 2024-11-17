import { Layerr } from "layerr";
import { VaultFormat } from "./VaultFormat.js";
import { Vault } from "../core/Vault.js";
import { Credentials } from "../credentials/Credentials.js";
import {
    executeArchiveID,
    executeComment,
    executeCreateEntry,
    executeCreateGroup,
    executeDeleteArchiveAttribute,
    executeDeleteEntry,
    executeDeleteEntryAttribute,
    executeDeleteEntryProperty,
    executeDeleteGroup,
    executeDeleteGroupAttribute,
    executeFormat,
    executeMoveEntry,
    executeMoveGroup,
    executePad,
    executeSetArchiveAttribute,
    executeSetEntryAttribute,
    executeSetEntryProperty,
    executeSetGroupAttribute,
    executeTitleGroup
} from "./formatA/commands.js";
import {
    COMMAND_MANIFEST,
    InigoCommand as Inigo,
    extractCommandComponents,
    getAllEntries,
    getAllGroups
} from "./formatA/tools.js";
import { Flattener } from "./formatA/Flattener.js";
import {
    getFormat,
    hasValidSignature,
    sign,
    stripSignature,
    vaultContentsEncrypted
} from "./formatA/signing.js";
import { describeVaultDataset } from "./formatA/describe.js";
import VaultComparator from "./formatA/VaultComparator.js";
import { getSharedAppEnv } from "../env/appEnv.js";
import { decodeStringValue, isEncoded } from "../tools/encoding.js";
import { generateUUID } from "../tools/uuid.js";
import { getMasterPassword } from "../credentials/memory/password.js";
import { historyArrayToString, historyStringToArray } from "./common.js";
import { smartStripRemovedAssets } from "./formatA/merge.js";
import {
    EntryChange,
    EntryChangeType,
    EntryID,
    FormatAEntry,
    FormatAGroup,
    FormatAVault,
    GroupID,
    History,
    PropertyKeyValueObject,
    VaultFormatID,
    VaultID,
    EntryPropertyType
} from "../types.js";

const COMMANDS = {
    aid: executeArchiveID,
    cen: executeCreateEntry,
    cgr: executeCreateGroup,
    cmm: executeComment,
    daa: executeDeleteArchiveAttribute,
    dea: executeDeleteEntryAttribute,
    dem: executeDeleteEntryProperty, // Meta deprecated, deletes property instead
    den: executeDeleteEntry,
    dep: executeDeleteEntryProperty,
    dga: executeDeleteGroupAttribute,
    dgr: executeDeleteGroup,
    fmt: executeFormat,
    men: executeMoveEntry,
    mgr: executeMoveGroup,
    pad: executePad,
    saa: executeSetArchiveAttribute,
    sea: executeSetEntryAttribute,
    sem: executeSetEntryProperty, // Meta deprecated, sets property instead
    sep: executeSetEntryProperty,
    sga: executeSetGroupAttribute,
    tgr: executeTitleGroup
};
const SHARE_COMMAND_EXP = /^\$[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\s/;
const UUID_LEN = 36;
const VALID_COMMAND_EXP = /^[a-z]{3}\s.+$/;

function emptyVault(): FormatAVault {
    return {
        id: null,
        groups: []
    };
}

export class VaultFormatA extends VaultFormat {
    static async encodeRaw(rawContent: History, credentials: Credentials): Promise<string> {
        const compress = getSharedAppEnv().getProperty("compression/v1/compressText");
        const encrypt = getSharedAppEnv().getProperty("crypto/v1/encryptText");
        const masterPassword = getMasterPassword(credentials.id);
        return Promise.resolve()
            .then(() => historyArrayToString(rawContent))
            .then((history) => compress(history))
            .then((compressed) => encrypt(compressed, masterPassword))
            .then(sign);
    }

    /**
     * Extract shares from a history collection
     * @param {String[]} history A history collection, containing shares
     * @returns {Object} The resulting separated histories. The object will
     *  always contain a `base` property containing the non-share history.
     *  Each share detected is set on the object under its share ID - being
     *  set to an array of history lines (non-prefixed) for that share.
     */
    static extractSharesFromHistory(history: History): Object {
        return history.reduce(
            (output, line) => {
                if (SHARE_COMMAND_EXP.test(line)) {
                    const shareID = line.substring(1, 1 + UUID_LEN);
                    const command = line.replace(SHARE_COMMAND_EXP, "");
                    output[shareID] = output[shareID] || [];
                    output[shareID].push(command);
                } else {
                    output.base.push(line);
                }
                return output;
            },
            { base: [] }
        );
    }

    static getFormatID(): VaultFormatID {
        return VaultFormatID.A;
    }

    static historiesDiffer(historyA: History, historyB: History): boolean {
        const differences = VaultComparator.calculateHistoryDifferences(historyA, historyB);
        return (
            differences === null ||
            differences.original.length > 0 ||
            differences.secondary.length > 0
        );
    }

    static isEncrypted(contents: string): boolean {
        return vaultContentsEncrypted(contents);
    }

    static parseEncrypted(encryptedContent: string, credentials: Credentials): Promise<History> {
        const decompress = getSharedAppEnv().getProperty("compression/v1/decompressText");
        const decrypt = getSharedAppEnv().getProperty("crypto/v1/decryptText");
        const masterPassword = getMasterPassword(credentials.id);
        return Promise.resolve()
            .then(() => {
                if (!hasValidSignature(encryptedContent)) {
                    throw new Error("No valid signature in vault");
                }
                return stripSignature(encryptedContent);
            })
            .then((encryptedData) => decrypt(encryptedData, masterPassword))
            .then((decrypted) => {
                if (decrypted && decrypted.length > 0) {
                    const decompressed = decompress(decrypted);
                    if (decompressed) {
                        return historyStringToArray(decompressed, VaultFormatID.A);
                    }
                }
                throw new Error("Failed reconstructing history: Decryption failed");
            });
    }

    static vaultFromMergedHistories(base: History, incoming: History): Vault {
        const differences = VaultComparator.calculateHistoryDifferences(base, incoming);
        if (differences === null) {
            throw new Error("Failed merging vault histories: No common base");
        }
        // Do a full merge to ensure the differences are merged, if any
        const { original: newHistoryBase, secondary: newHistoryIncoming, common } = differences;
        const inlineHistory = [
            ...common,
            ...smartStripRemovedAssets([...newHistoryBase, ...newHistoryIncoming])
        ];
        // Prepare vault target
        const newVault = new Vault(VaultFormatA);
        newVault.format.erase();
        // merge all history and execute on new vault
        newVault.format.execute(inlineHistory);
        newVault.format.dirty = false;
        return newVault;
    }

    protected _history: History;
    public source: FormatAVault;

    constructor(source: FormatAVault = emptyVault()) {
        super(source);
        this._history = [];
        this._history.format = VaultFormatID.A;
    }

    cloneEntry(entry: FormatAEntry, targetGroupID: GroupID) {}

    cloneGroup(group: FormatAGroup, targetGroupID: GroupID) {
        const groupDesc = describeVaultDataset(group, targetGroupID);
        this.execute(groupDesc);
    }

    createEntry(groupID: GroupID, entryID: EntryID) {
        this.execute(
            Inigo.create(Inigo.Command.CreateEntry)
                .addArgument(groupID)
                .addArgument(entryID)
                .generateCommand()
        );
    }

    createGroup(parentID: GroupID, groupID: GroupID) {
        this.execute(
            Inigo.create(Inigo.Command.CreateGroup)
                .addArgument(parentID)
                .addArgument(groupID)
                .generateCommand()
        );
    }

    deleteEntry(entryID: EntryID) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteEntry).addArgument(entryID).generateCommand()
        );
    }

    deleteEntryAttribute(entryID: EntryID, attribute: string) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteEntryAttribute)
                .addArgument(entryID)
                .addArgument(attribute)
                .generateCommand()
        );
    }

    deleteEntryProperty(entryID: EntryID, property: string) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteEntryProperty)
                .addArgument(entryID)
                .addArgument(property)
                .generateCommand()
        );
    }

    deleteGroup(groupID: GroupID) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteGroup).addArgument(groupID).generateCommand()
        );
    }

    deleteGroupAttribute(groupID: GroupID, attribute: string) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteGroupAttribute)
                .addArgument(groupID)
                .addArgument(attribute)
                .generateCommand()
        );
    }

    deleteVaultAttribute(attribute: string) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteArchiveAttribute)
                .addArgument(attribute)
                .generateCommand()
        );
    }

    erase() {
        super.erase();
        Object.assign(this.source, emptyVault());
        this.emit("erased");
    }

    execute(commandOrCommands: string | Array<string>) {
        if (this.readOnly) {
            throw new Error("Format is in read-only mode");
        }
        const commands = Array.isArray(commandOrCommands) ? commandOrCommands : [commandOrCommands];
        commands.forEach((command) => this._executeCommand(command));
        const lastCommand = commands[commands.length - 1];
        if (/^pad\s/i.test(lastCommand) === false) {
            this._pad();
        }
        this.dirty = true;
        this.emit("commandsExecuted");
    }

    findEntryByID(id: EntryID): FormatAEntry {
        return this.getAllEntries().find((entry) => entry.id === id) || null;
    }

    findGroupByID(id: GroupID): FormatAGroup {
        return this.getAllGroups().find((group) => group.id === id) || null;
    }

    findGroupContainingEntryID(id: EntryID): FormatAGroup {
        const matchingEntry = this.getAllEntries().find((entry) => entry.id === id);
        if (matchingEntry) {
            return this.getAllGroups().find((group) => group.id === matchingEntry.parentID) || null;
        }
        return null;
    }

    findGroupContainingGroupID(id: GroupID): FormatAGroup {
        const searchGroups = (groups: Array<FormatAGroup>): FormatAGroup => {
            for (const group of groups) {
                if (group.id === id) return null;
                const children = group.groups || [];
                const childMatch = !!children.find((child) => child.id === id);
                if (childMatch) return group;
                const deepGroup = searchGroups(children);
                if (deepGroup) return deepGroup;
            }
            return null;
        };
        return searchGroups(this.getAllGroups());
    }

    generateID() {
        this.execute(
            Inigo.create(Inigo.Command.ArchiveID).addArgument(generateUUID()).generateCommand()
        );
    }

    getAllEntries(parentID: GroupID = null): Array<FormatAEntry> {
        return getAllEntries(this.source, parentID);
    }

    getAllGroups(parentID: GroupID = null): Array<FormatAGroup> {
        return getAllGroups(this.source, parentID);
    }

    getEntryAttributes(entrySource: FormatAEntry): PropertyKeyValueObject {
        return entrySource.attributes;
    }

    getEntryChanges(entrySource: FormatAEntry): Array<EntryChange> {
        return (entrySource.history || [])
            .filter((item) => item.propertyType === EntryPropertyType.Property)
            .map((item) => {
                const type = !item.originalValue
                    ? EntryChangeType.Created
                    : typeof item.newValue === "string"
                      ? EntryChangeType.Modified
                      : EntryChangeType.Deleted;
                const change: EntryChange = {
                    property: item.property,
                    type,
                    ts: null
                };
                if (type === EntryChangeType.Created || EntryChangeType.Modified) {
                    change.value = item.newValue;
                }
                return change;
            });
    }

    getEntryProperties(entrySource: FormatAEntry): PropertyKeyValueObject {
        return entrySource.properties;
    }

    getFormat(): any {
        return VaultFormatA;
    }

    getGroupAttributes(groupSource: FormatAGroup): PropertyKeyValueObject {
        return groupSource.attributes;
    }

    getGroupTitle(groupSource: FormatAGroup): string {
        return groupSource.title;
    }

    getHistory(): History {
        if (!this._history.format) {
            this._history.format = VaultFormatID.A;
        }
        return this._history;
    }

    getItemID(itemSource: FormatAGroup | FormatAEntry): GroupID | EntryID {
        return itemSource.id;
    }

    getItemParentID(itemSource: FormatAGroup | FormatAEntry): GroupID | "0" {
        return itemSource.parentID;
    }

    getVaultAttributes() {
        return (<FormatAVault>this.source).attributes || {};
    }

    getVaultID(): VaultID {
        return this.source.id;
    }

    initialise() {
        const hasFormatted = typeof this.source.format === "string";
        if (!hasFormatted) {
            this.execute(
                Inigo.create(Inigo.Command.Format).addArgument(getFormat()).generateCommand()
            );
        }
        if (!this.source.id) {
            this.generateID();
        }
    }

    moveEntry(entryID: EntryID, groupID: GroupID) {
        this.execute(
            Inigo.create(Inigo.Command.MoveEntry)
                .addArgument(entryID)
                .addArgument(groupID)
                .generateCommand()
        );
    }

    moveGroup(groupID: GroupID, newParentID: GroupID) {
        this.execute(
            Inigo.create(Inigo.Command.MoveGroup)
                .addArgument(groupID)
                .addArgument(newParentID)
                .generateCommand()
        );
    }

    optimise() {
        // Flatten
        const flattener = new Flattener(this);
        if (flattener.canBeFlattened()) {
            flattener.flatten();
        }
    }

    setEntryAttribute(entryID: EntryID, attribute: string, value: string) {
        this.execute(
            Inigo.create(Inigo.Command.SetEntryAttribute)
                .addArgument(entryID)
                .addArgument(attribute)
                .addArgument(value)
                .generateCommand()
        );
    }

    setEntryProperty(entryID: EntryID, property: string, value: string) {
        this.execute(
            Inigo.create(Inigo.Command.SetEntryProperty)
                .addArgument(entryID)
                .addArgument(property)
                .addArgument(value)
                .generateCommand()
        );
    }

    setGroupAttribute(groupID: GroupID, attribute: string, value: string) {
        this.execute(
            Inigo.create(Inigo.Command.SetGroupAttribute)
                .addArgument(groupID)
                .addArgument(attribute)
                .addArgument(value)
                .generateCommand()
        );
    }

    setGroupTitle(groupID: GroupID, title: string) {
        this.execute(
            Inigo.create(Inigo.Command.SetGroupTitle)
                .addArgument(groupID)
                .addArgument(title)
                .generateCommand()
        );
    }

    setVaultAttribute(key: string, value: string) {
        this.execute(
            Inigo.create(Inigo.Command.SetArchiveAttribute)
                .addArgument(key)
                .addArgument(value)
                .generateCommand()
        );
    }

    _executeCommand(command: string) {
        let currentCommand = command,
            shareID = null;
        if (SHARE_COMMAND_EXP.test(currentCommand)) {
            const shareMatch =
                /^\$([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/.exec(
                    currentCommand
                );
            shareID = shareMatch[1];
            currentCommand = currentCommand.replace(SHARE_COMMAND_EXP, "");
        }
        if (!VALID_COMMAND_EXP.test(currentCommand)) {
            throw new Error(`Invalid command: ${command}`);
        }
        if (/^pad\s/i.test(command) && /^pad\s/i.test(this.history[this.history.length - 1])) {
            // Skip adding extra pad
            return;
        }
        const commandComponents = extractCommandComponents(currentCommand);
        const commandKey = commandComponents.shift().toLowerCase();
        const executeCommand = COMMANDS[commandKey];
        try {
            executeCommand.apply(null, [
                this.source,
                {
                    // opts
                    shareID
                },
                ...this._processCommandParameters(commandKey, commandComponents)
            ]);
            this.history.push(command);
        } catch (err) {
            throw new Layerr(err, `Failed executing vault command: ${commandKey}`);
        }
    }

    _pad() {
        this._executeCommand(Inigo.generatePaddingCommand());
    }

    _processCommandParameters(commandKey: string, parameters: Array<string>) {
        const friendlyCommand = Object.keys(COMMAND_MANIFEST).find((manifestKey) => {
            return COMMAND_MANIFEST[manifestKey].s === commandKey;
        });
        const commandDescriptor = COMMAND_MANIFEST[friendlyCommand];
        if (!commandDescriptor) {
            throw new Error(
                `Cannot process command parameters: no command found for key: ${commandKey}`
            );
        }
        return parameters.map((parameter, i) => {
            if (commandDescriptor.args[i].encode === true) {
                if (isEncoded(parameter)) {
                    return decodeStringValue(parameter);
                }
            }
            return parameter;
        });
    }
}
