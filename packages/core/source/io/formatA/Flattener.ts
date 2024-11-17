import { describeVaultDataset } from "./describe.js";
import { VaultFormatA } from "../VaultFormatA.js";
import { FormatAVault } from "../../types.js";

/**
 * Check if a command should be preserved (not flattened)
 * @param command The command to check
 * @returns True if the command is to be kept
 * @private
 * @static
 * @memberof Flattener
 */
function mustBePreserved(command: string): boolean {
    const commandName = command.substr(0, 3);
    // Note: "fmt" and "aid" are generated automatically and do not need to be preserved
    return ["cmm"].indexOf(commandName) >= 0;
}

/**
 * Flattener class for flattening archive history sets
 */
export class Flattener {
    /**
     * Minimum history lines before flattening can occur
     * @static
     * @memberof Flattener
     */
    static FLATTENING_MIN_LINES = 6000;
    /**
     * Number of lines to preserve (most recent)
     * @static
     * @memberof Flattener
     */
    static PRESERVE_LINES = 5000;

    format: VaultFormatA;

    constructor(format: VaultFormatA) {
        this.format = format;
    }

    /**
     * Check if the dataset can be flattened
     * @returns True if it can be flattened
     * @memberof Flattener
     */
    canBeFlattened(): boolean {
        return this.format.history.length >= Flattener.FLATTENING_MIN_LINES;
    }

    /**
     * Flatten a dataset
     * @param force Force flattening even if it is detected to be unnecessary
     * @returns True if flattening occurred, false otherwise
     * @memberof Flattener
     */
    flatten(force: boolean = false): boolean {
        const history = this.format.history;
        const preservedLines = [];
        const tempFormat = new VaultFormatA();
        let availableLines = history.length - Flattener.PRESERVE_LINES;
        // check if possible to flatten
        if (availableLines <= 0 || !this.canBeFlattened()) {
            if (!force) {
                return false;
            }
            availableLines = history.length;
        }
        // execute early history
        let currentCommand;
        for (let i = 0; i < availableLines; i += 1) {
            currentCommand = history[i];
            if (mustBePreserved(currentCommand)) {
                preservedLines.push(currentCommand);
            }
            tempFormat.execute(currentCommand);
        }
        // describe the archive at its current state
        const cleanHistory = describeVaultDataset(tempFormat.source as FormatAVault, "0");
        // prepare to replay
        const newHistory = [
            ...preservedLines, // preserved commands that cannot be stripped
            ...cleanHistory, // the newly flattened description commands
            ...history.slice(availableLines) // the existing history minus the flattened portion
        ];
        // clear the system
        this.format.erase();
        // replay all history (expensive)
        this.format.execute(newHistory);
        // newHistory.forEach(this.format.execute.bind(this._westley));
        return true;
    }
}
