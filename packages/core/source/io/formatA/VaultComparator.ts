import { Vault } from "../../core/Vault.js";
import { createVaultFacade } from "../../facades/vault.js";
import { History } from "../../types.js";

const PRIMATIVES = ["string", "number", "boolean", "undefined"];

export interface CommonRecentCommandResult {
    a: number;
    b: number;
}

/**
 * Calculate the common command indexes between 2 histories.
 * The common index is where a padding ID matches that of the other history,
 * at some point. If we assume one history may have been flattened, we cannot
 * assume that the entire past history will be the same, but
 * we can assume that at that point, the histories produce the same structure.
 * Because the histories may be different in the future, we use the newest
 * matching pad ID to create a common link between the 2 histories.
 * @param historyA The original history
 * @param historyB The secondary history
 * @returns Returns null if no common point, or an object with the common
 *  information. `a` and `b` are the indexes where the common padding occurs.
 */
function calculateCommonRecentCommand(
    historyA: History,
    historyB: History
): CommonRecentCommandResult | null {
    const getCommandType = (fullCommand) =>
        fullCommand && fullCommand.length >= 3 ? fullCommand.substr(0, 3) : "";
    const getPaddingID = (command) => command.split(" ")[1];
    for (let a = historyA.length - 1; a >= 9; a -= 1) {
        if (getCommandType(historyA[a]) === "pad") {
            const paddingA = getPaddingID(historyA[a]);
            for (let b = historyB.length - 1; b >= 0; b -= 1) {
                if (
                    getCommandType(historyB[b]) === "pad" &&
                    getPaddingID(historyB[b]) === paddingA
                ) {
                    return { a, b };
                }
            }
        }
    }
    return null;
}

export interface HistoryDifferences {
    original: History;
    secondary: History;
    common: History;
}

/**
 * Calculate the differences, in commands, between two histories
 * @returns Returns null if no common base is found, or the command
 *  differences as two arrays
 */
function calculateHistoryDifferences(historyA: History, historyB: History): HistoryDifferences {
    const workingA = [...historyA];
    const workingB = [...historyB];
    const commonIndexes = calculateCommonRecentCommand(workingA, workingB);
    if (commonIndexes === null) {
        return null;
    }
    return {
        original: workingA.splice(commonIndexes.a + 1, workingA.length),
        secondary: workingB.splice(commonIndexes.b + 1, workingB.length),
        common: workingA
    };
}

/**
 * De-dupe an array
 * @param arr The array
 * @returns The de-duped array
 */
function dedupe<T>(arr: Array<T>): Array<T> {
    return arr.filter(function (item, pos) {
        return arr.indexOf(item) === pos;
    });
}

/**
 * Naïve difference calculator for objects and variables
 * Does not care about array order or instance pointers - only checks for
 * deep *equality*.
 * @param object1 The first item
 * @param object2 The second item
 * @returns True if different, false if equal
 * @private
 */
function different(object1: Object, object2: Object): boolean {
    if (Array.isArray(object1) && Array.isArray(object2)) {
        let differs = object1.some(function (item1) {
            return !object2.some(function (item2) {
                return different(item1, item2) === false;
            });
        });
        if (!differs) {
            return object2.some(function (item1) {
                return !object1.some(function (item2) {
                    return different(item1, item2) === false;
                });
            });
        }
    } else if (typeof object1 === "object" && typeof object2 === "object") {
        if (object1 === null && object2 === null) {
            return false;
        }
        let allKeys = dedupe([...Object.keys(object1), ...Object.keys(object2)]),
            isMissingAKey = allKeys.some(function (key) {
                return !(object1.hasOwnProperty(key) && object2.hasOwnProperty(key));
            });
        if (!isMissingAKey) {
            return allKeys.some(function (key) {
                return different(object1[key], object2[key]);
            });
        }
    } else if (PRIMATIVES.indexOf(typeof object1) === PRIMATIVES.indexOf(typeof object2)) {
        return object1 !== object2;
    }
    return true;
}

/**
 * Vault comparison class
 */
export default class VaultComparator {
    static calculateHistoryDifferences(historyA: History, historyB: History): HistoryDifferences {
        return calculateHistoryDifferences(historyA, historyB);
    }

    _vaultA: Vault;
    _vaultB: Vault;

    /**
     * Constructor for the vault comparator
     * @param originalVault The primary vault
     * @param secondaryVault The secondary vault
     */
    constructor(originalVault: Vault, secondaryVault: Vault) {
        this._vaultA = originalVault;
        this._vaultB = secondaryVault;
    }

    /**
     * Calculate the differences, in commands, between the two vaults
     * @returns Returns null if no common base is found, or the command
     *  differences as two arrays
     * @memberof VaultComparator
     */
    calculateDifferences(): HistoryDifferences {
        return VaultComparator.calculateHistoryDifferences(
            this._vaultA.format.history,
            this._vaultB.format.history
        );
    }

    /**
     * Check if the current vaults differ
     * @returns True if the vaults are different
     * @memberof VaultComparator
     */
    vaultsDiffer(): boolean {
        const objA = createVaultFacade(this._vaultA);
        const objB = createVaultFacade(this._vaultB);
        // ignore the IDs
        delete objA.id;
        delete objB.id;
        // ignore facade tags
        delete objA._tag;
        delete objB._tag;
        return different(objA, objB);
    }
}
