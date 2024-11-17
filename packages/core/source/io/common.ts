import { History, VaultFormatID } from "../types.js";

/**
 * Convert array of history lines to a string
 * @param historyArray An array of history items
 * @returns The string representation
 * @private
 */
export function historyArrayToString(historyArray: History): string {
    return historyArray.join("\n");
}

/**
 * Convert a history string to an array
 * @param historyString The history string
 * @returns An array of history items
 * @private
 */
export function historyStringToArray(historyString: string, formatID?: VaultFormatID): History {
    const hist = <History>historyString.split("\n");
    if (formatID) {
        hist.format = formatID;
    }
    return hist;
}
