import { Group } from "../core/Group.js";
import { Vault } from "../core/Vault.js";
import { History } from "../types.js";

const SHARE_COMMAND_EXP = /^\$[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\s/;

export function mergeHistories(initial, incoming) {
    // @todo Share merging
    return [];
}

/**
 * Move a group between archives
 * @param movingGroup The group to move
 * @param targetGroup The group to move to
 * @throws {Error} Throws if the remote type is not recognised
 */
export function moveGroupBetweenVaults(movingGroup: Group, targetGroup: Group | Vault) {
    // Clone
    const targetVault = targetGroup instanceof Vault ? (targetGroup as Vault) : targetGroup.vault;
    targetVault.format.cloneGroup(
        movingGroup._source,
        targetGroup instanceof Vault ? "0" : targetGroup.id
    );
    // Delete original
    movingGroup.delete(/* skip trash */ true);
}

/**
 * Prepend the share prefix to every line that doesn't have it
 * @param history Array of history lines
 * @returns Prefixed history lines
 */
export function prependSharePrefix(history: History, shareID: string): History {
    return history.map((line) => (SHARE_COMMAND_EXP.test(line) ? line : `$${shareID} ${line}`));
}

/**
 * Remove the share prefix to every line that has it
 * @param history Array of history lines
 * @returns Non-prefixed history lines
 */
export function removeSharePrefix(history: History): History {
    return history.map((line) =>
        SHARE_COMMAND_EXP.test(line) ? line.replace(SHARE_COMMAND_EXP, "") : line
    );
}
