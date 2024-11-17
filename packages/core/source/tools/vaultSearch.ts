import { Group } from "../core/Group.js";
import { Entry } from "../core/Entry.js";

/**
 * Find entry instances by filtering with a compare function
 * @param groups The groups to check in
 * @param compareFn The callback comparison function, return true to keep and false
 *  to strip
 * @returns An array of found entries
 */
export function findEntriesByCheck(
    groups: Array<Group>,
    compareFn: (entry: Entry) => boolean
): Array<Entry> {
    let foundEntries = [],
        newEntries;
    groups.forEach((group: Group) => {
        newEntries = group.getEntries().filter(compareFn);
        if (newEntries.length > 0) {
            foundEntries = foundEntries.concat(newEntries);
        }
        newEntries = findEntriesByCheck(group.getGroups(), compareFn);
        if (newEntries.length > 0) {
            foundEntries = foundEntries.concat(newEntries);
        }
    });
    return foundEntries;
}

/**
 * Find group instances within groups that satisfy some check
 * @param groups The groups to check within
 * @param compareFn A comparision function - return true to keep, false to strip
 * @returns An array of found groups
 */
export function findGroupsByCheck(
    groups: Array<Group>,
    compareFn: (group: Group) => boolean
): Array<Group> {
    let foundGroups = groups.filter(compareFn);
    groups.forEach((group: Group) => {
        const subFound = findGroupsByCheck(group.getGroups(), compareFn);
        if (subFound.length > 0) {
            foundGroups = foundGroups.concat(subFound);
        }
    });
    return foundGroups;
}

/**
 * Get all entries within a collection of groups
 * @param groups An array of groups
 * @returns An array of entries
 */
export function getAllEntries(groups: Array<Group>): Array<Entry> {
    return groups.reduce((current: Array<Entry>, group: Group) => {
        const theseEntries = group.getEntries();
        const subEntries = getAllEntries(group.getGroups());
        if (theseEntries.length > 0) {
            current = current.concat(theseEntries);
        }
        if (subEntries.length > 0) {
            current = current.concat(subEntries);
        }
        return current;
    }, []);
}
