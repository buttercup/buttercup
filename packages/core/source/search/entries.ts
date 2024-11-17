import { Entry } from "../core/Entry.js";
import { Group } from "../core/Group.js";
import { GroupID } from "../types.js";

export function findEntriesByProperty(
    entries: Array<Entry>,
    property: string | RegExp,
    value: string | RegExp
): Array<Entry> {
    return entries.filter((entry) => {
        const props = entry.getProperties(property);
        const propKeys = Object.keys(props);
        return propKeys.length > 0
            ? propKeys.some((propKey) => {
                  const itemValue = props[propKey];
                  if (value instanceof RegExp) {
                      return value.test(itemValue);
                  } else {
                      return itemValue.indexOf(value) >= 0;
                  }
              })
            : false;
    });
}

export function getAllChildEntries(entries: Array<Entry>, parentGroupID: GroupID): Array<Entry> {
    if (parentGroupID === "0") return [...entries];
    return entries.filter((entry) => {
        const parentID = entry.vault.format.getItemParentID(entry._source);
        if (parentID === parentGroupID) return true;
        let nextParent: Group;
        while (
            (nextParent = nextParent ? nextParent.getParentGroup() : entry.getGroup()) !== null
        ) {
            if (nextParent.id === parentGroupID) {
                return true;
            }
        }
        return false;
    });
}
