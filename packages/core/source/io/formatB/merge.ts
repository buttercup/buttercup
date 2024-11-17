import { cloneValue, mergeValues } from "./history.js";
import {
    EntryPropertyType,
    FormatBEntry,
    FormatBGroup,
    FormatBKeyValueObject,
    FormatBVault
} from "../../types.js";

function cloneEntry(entry: FormatBEntry): FormatBEntry {
    return {
        id: entry.id,
        p: Object.assign({}, entry.p),
        a: Object.assign({}, entry.a),
        g: entry.g
    };
}

function cloneGroup(group: FormatBGroup): FormatBGroup {
    return {
        id: group.id,
        t: group.t,
        g: group.g,
        a: Object.assign({}, group.a)
    };
}

function mergeProperties(
    propsA: FormatBKeyValueObject,
    propsB: FormatBKeyValueObject,
    type: EntryPropertyType
): FormatBKeyValueObject {
    const allKeys = [...new Set([...Object.keys(propsA), ...Object.keys(propsB)])];
    return allKeys.reduce((output, nextKey) => {
        if ((propsA[nextKey] && !propsB[nextKey]) || (!propsA[nextKey] && propsB[nextKey])) {
            // Item is only on one props object
            output[nextKey] = cloneValue(propsA[nextKey] || propsB[nextKey]);
        } else {
            // Item exists on both objects, so merge
            output[nextKey] = mergeValues(propsA[nextKey], propsB[nextKey], type);
        }
        return output;
    }, {});
}

export function mergeRawVaults(base: FormatBVault, incoming: FormatBVault): FormatBVault {
    const newVault: FormatBVault = {
        id: base.id,
        a: mergeProperties(base.a, incoming.a, EntryPropertyType.Attribute),
        g: [],
        e: [],
        c: base.c,
        del: {
            e: { ...(base.del?.e || {}) },
            g: { ...(base.del?.g || {}) }
        }
    };
    // Setup deletions
    for (const entryID in incoming.del.e) {
        if (
            (newVault.del.e[entryID] && incoming.del.e[entryID] < newVault.del.e[entryID]) ||
            !newVault.del.e[entryID]
        ) {
            newVault.del.e[entryID] = incoming.del.e[entryID];
        }
    }
    for (const groupID in incoming.del.g) {
        if (
            (newVault.del.g[groupID] && incoming.del.g[groupID] < newVault.del.g[groupID]) ||
            !newVault.del.g[groupID]
        ) {
            newVault.del.g[groupID] = incoming.del.g[groupID];
        }
    }
    // Process unique (one vault only) groups
    const uniqueGroupsBase = base.g.filter(
        (group) => !incoming.g.find((inGroup) => inGroup.id === group.id)
    );
    const uniqueGroupsIncoming = incoming.g.filter(
        (group) => !base.g.find((baseGroup) => baseGroup.id === group.id)
    );
    [...uniqueGroupsBase, ...uniqueGroupsIncoming].forEach((group) => {
        if (newVault.del.g[group.id]) return;
        newVault.g.push(cloneGroup(group));
    });
    // Process all matching groups (on both vaults)
    base.g.forEach((baseGroup) => {
        // Skip unique groups
        if (uniqueGroupsBase.indexOf(baseGroup) >= 0) return;
        // Find matching on incoming vault
        const incomingGroup = incoming.g.find((ing) => ing.id === baseGroup.id);
        // Setup new group
        const newGroup = cloneGroup(incomingGroup);
        newGroup.a = mergeProperties(baseGroup.a, incomingGroup.a, EntryPropertyType.Attribute);
        newVault.g.push(newGroup);
    });
    // Process unique (one vault only) entries
    const uniqueEntriesBase = base.e.filter(
        (entry) => !incoming.e.find((inEntry) => inEntry.id === entry.id)
    );
    const uniqueEntriesIncoming = incoming.e.filter(
        (entry) => !base.e.find((baseEntry) => baseEntry.id === entry.id)
    );
    [...uniqueEntriesBase, ...uniqueEntriesIncoming].forEach((entry) => {
        if (newVault.del.e[entry.id]) return;
        newVault.e.push(cloneEntry(entry));
    });
    // Process all matching entries (on both vaults)
    base.e.forEach((baseEntry) => {
        // Skip unique groups
        if (uniqueEntriesBase.indexOf(baseEntry) >= 0) return;
        // Find matching on incoming vault
        const incomingEntry = incoming.e.find((ing) => ing.id === baseEntry.id);
        // Setup new group
        const newEntry = cloneEntry(incomingEntry);
        newEntry.p = mergeProperties(baseEntry.p, incomingEntry.p, EntryPropertyType.Property);
        newEntry.a = mergeProperties(baseEntry.a, incomingEntry.a, EntryPropertyType.Attribute);
        newEntry.g = incomingEntry.g;
        newVault.e.push(newEntry);
    });
    return newVault;
}
