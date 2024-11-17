import { Group } from "../core/Group.js";
import { GroupID } from "../types.js";

/**
 * Find groups by their title
 * @param groups The groups to search through
 * @param title The title to search for. May be a regular expression.
 * @returns An array of found groups
 */
export function findGroupsByTitle(groups: Array<Group>, title: string | RegExp): Array<Group> {
    return groups.filter((group) => {
        if (title instanceof RegExp) {
            return title.test(group.getTitle());
        }
        return group.getTitle().indexOf(title) >= 0;
    });
}

export function getAllChildGroups(groups: Array<Group>, parentID: GroupID): Array<Group> {
    if (parentID === "0") return [...groups];
    const getParentID = (g: Group) => g.vault.format.getItemParentID(g._source);
    return groups.filter((group) => {
        const thisParentID = getParentID(group);
        if (thisParentID === parentID) return true;
        let nextParent: Group;
        while (
            (nextParent = nextParent ? nextParent.getParentGroup() : group.getParentGroup()) !==
            null
        ) {
            if (nextParent.id === parentID) return true;
        }
        return false;
    });
}
