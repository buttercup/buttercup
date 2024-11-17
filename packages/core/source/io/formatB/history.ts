import { getTimestamp } from "../../tools/date.js";
import { EntryPropertyType, FormatBValue, FormatBValueHistoryItem } from "../../types.js";

export const MAX_ATTRIBUTE_HISTORY = 3;
export const MAX_PROPERTY_HISTORY = 5;

export function cloneValue(value: FormatBValue) {
    return {
        value: value.value,
        created: value.created,
        updated: value.updated,
        history: value.history.map((item) => Object.assign({}, item))
    };
}

function filterDuplicateHistoryItems(
    items: Array<FormatBValueHistoryItem>
): Array<FormatBValueHistoryItem> {
    return items.filter(
        (thisItem, thisIndex, itemArr) =>
            itemArr.findIndex(
                (sub) => sub.value === thisItem.value && sub.updated === thisItem.updated
            ) === thisIndex
    );
}

export function mergeValues(
    value1: FormatBValue,
    value2: FormatBValue,
    type: EntryPropertyType
): FormatBValue {
    const mostRecentValue =
        value1.updated > value2.updated || value1.updated === value2.updated ? value1 : value2;
    const olderValue = value1 === mostRecentValue ? value2 : value1;
    const newHistory = sortValueHistory(
        filterDuplicateHistoryItems([
            valueToHistoryItem(olderValue),
            ...value1.history,
            ...value2.history
        ])
    );
    return {
        value: mostRecentValue.value,
        created: mostRecentValue.created,
        updated: mostRecentValue.updated,
        history: trimValueHistory(newHistory, type)
    };
}

export function newRawValue(value: string): FormatBValue {
    const ts = getTimestamp();
    return {
        value,
        created: ts,
        updated: ts,
        history: []
    };
}

export function sortValueHistory(
    history: Array<FormatBValueHistoryItem>
): Array<FormatBValueHistoryItem> {
    return history.sort((a, b) => {
        if (a.updated > b.updated) {
            return -1;
        } else if (b.updated > a.updated) {
            return 1;
        }
        return 0;
    });
}

export function trimValueHistory(
    history: Array<FormatBValueHistoryItem>,
    type: EntryPropertyType
): Array<FormatBValueHistoryItem> {
    const max = type === EntryPropertyType.Attribute ? MAX_ATTRIBUTE_HISTORY : MAX_PROPERTY_HISTORY;
    const sorted = sortValueHistory(history);
    return sorted.slice(0, max);
}

export function valueToHistoryItem(value: FormatBValue): FormatBValueHistoryItem {
    return {
        value: value.value,
        updated: value.updated
    };
}
