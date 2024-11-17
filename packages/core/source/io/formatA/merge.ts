import { History } from "../../types.js";

const ENTRY_SPECIFIC_TARGET_COMMANDS = {
    cen: 1, // entry ID is argument 2
    den: 0,
    dea: 0,
    dem: 0,
    dep: 0,
    men: 0,
    sea: 0,
    sem: 0,
    sep: 0
};
const GROUP_SPECIFIC_TARGET_COMMANDS = {
    cgr: 1, // group ID is argument 2
    dgr: 0,
    dga: 0,
    mgr: 0,
    sga: 0,
    tgr: 0
};

/**
 * Process history in order, following which entries/groups are
 *  deleted and them removing future references to them
 * @param history The history set to filter
 * @returns A filtered set of history, with problematic removals
 *  stripped out
 */
export function smartStripRemovedAssets(history: History): History {
    const deletedEntries: Set<string> = new Set([]);
    const deletedGroups: Set<string> = new Set([]);
    return history.filter((line) => {
        const [command, ...args] = line.split(/\s/g);
        if (
            typeof ENTRY_SPECIFIC_TARGET_COMMANDS[command] === "number" &&
            deletedEntries.has(args[ENTRY_SPECIFIC_TARGET_COMMANDS[command]])
        ) {
            return false;
        }
        if (
            typeof GROUP_SPECIFIC_TARGET_COMMANDS[command] === "number" &&
            deletedGroups.has(args[GROUP_SPECIFIC_TARGET_COMMANDS[command]])
        ) {
            return false;
        }
        if (command === "den") {
            const [entryID] = args;
            deletedEntries.add(entryID);
        } else if (command === "dgr") {
            const [groupID] = args;
            deletedGroups.add(groupID);
        } else if (command === "men" || command === "mgr") {
            const [targetGroupID] = args;
            if (deletedGroups.has(targetGroupID)) return false;
        } else if (command === "cen" || command === "cgr") {
            const [targetGroupID] = args;
            if (deletedGroups.has(targetGroupID)) return false;
        }
        return true;
    });
}
