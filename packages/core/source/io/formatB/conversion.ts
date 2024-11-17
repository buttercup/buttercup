import { newRawValue } from "./history.js";
import { getDateString } from "../../tools/date.js";
import {
    getAllEntries as getAllFormatAEntries,
    getAllGroups as getAllFormatAGroups
} from "../formatA/tools.js";
import {
    EntryPropertyType,
    FormatAEntry,
    FormatAGroup,
    FormatAVault,
    FormatBEntry,
    FormatBGroup,
    FormatBKeyValueObject,
    FormatBVault,
    PropertyKeyValueObject
} from "../../types.js";

export function convertFormatAEntry(entry: FormatAEntry): FormatBEntry {
    const changes = entry.history || [];
    const formatBEntry = {
        id: entry.id,
        a: flatKeyValueObjectToValuesObject(entry.attributes || {}),
        p: flatKeyValueObjectToValuesObject(entry.properties || {}),
        g: entry.parentID
    };
    for (const key in formatBEntry.a) {
        const propChanges = changes.filter(
            (change) =>
                change.property === key && change.propertyType === EntryPropertyType.Attribute
        );
        formatBEntry.a[key].history = propChanges.map((propChange) => ({
            value: propChange.newValue,
            updated: null
        }));
    }
    for (const key in formatBEntry.p) {
        const propChanges = changes.filter(
            (change) =>
                change.property === key && change.propertyType === EntryPropertyType.Property
        );
        formatBEntry.p[key].history = propChanges.map((propChange) => ({
            value: propChange.newValue,
            updated: null
        }));
    }
    return formatBEntry;
}

export function convertFormatAGroup(group: FormatAGroup): FormatBGroup {
    return {
        id: group.id,
        a: flatKeyValueObjectToValuesObject(group.attributes || {}),
        t: group.title,
        g: group.parentID
    };
}

export function convertFormatAVault(vault: FormatAVault): FormatBVault {
    return {
        id: vault.id,
        a: flatKeyValueObjectToValuesObject(vault.attributes || {}),
        g: getAllFormatAGroups(vault).map((group) => convertFormatAGroup(group)),
        e: getAllFormatAEntries(vault).map((entry) => convertFormatAEntry(entry)),
        c: getDateString(),
        del: {
            e: {},
            g: {}
        }
    };
}

function flatKeyValueObjectToValuesObject(obj: PropertyKeyValueObject): FormatBKeyValueObject {
    return Object.keys(obj).reduce(
        (output, key) =>
            Object.assign(output, {
                [key]: newRawValue(obj[key])
            }),
        {}
    );
}

export function isFormatBEntry(entry: FormatAEntry | FormatBEntry): entry is FormatBEntry {
    return (<FormatBEntry>entry).g !== undefined;
}

export function isFormatBGroup(group: FormatAGroup | FormatBGroup): group is FormatBGroup {
    return (<FormatBGroup>group).g !== undefined;
}

/**
 * Get a key-value object from a Format-B values object.
 * This strips deleted properties.
 * @param valuesObj
 */
export function valuesObjectToKeyValueObject(
    valuesObj: FormatBKeyValueObject
): PropertyKeyValueObject {
    return Object.keys(valuesObj).reduce((output, key) => {
        if (valuesObj[key].deleted) return output;
        return Object.assign(output, {
            [key]: valuesObj[key].value
        });
    }, {});
}
