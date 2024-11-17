import { Entry } from "../core/Entry.js";
import { Group } from "../core/Group.js";
import { objectValues } from "./polyfill.js";
import { GroupID } from "../types.js";

export enum EntryURLType {
    Any = "any",
    General = "general",
    Icon = "icon",
    Login = "login"
}

const URL_PROP = /(^|[a-zA-Z0-9_-]|\b)(ur[li]|UR[LI]|Ur[li])(\b|$|[_-])/;
const URL_PROP_ICON = /icon[\s_-]*ur[li]/i;

export function getEntryPath(entry: Entry): Array<GroupID> {
    let lastParent: Group = null;
    const path: Array<GroupID> = [];
    do {
        lastParent = lastParent ? lastParent.getParentGroup() : entry.getGroup();
        if (lastParent) {
            path.unshift(lastParent.id);
        }
    } while (lastParent);
    return path;
}

/**
 * Get URLs from an entry's properties
 * Allows for preferential sorting
 * @param properties The entry properties
 * @param preference Optional URL type preference
 */
export function getEntryURLs(
    properties: { [key: string]: string },
    preference: EntryURLType = EntryURLType.Any
): Array<string> {
    const urlRef = Object.keys(properties)
        .filter((key) => URL_PROP.test(key))
        .reduce(
            (output, nextKey) =>
                Object.assign(output, {
                    [nextKey]: properties[nextKey]
                }),
            {}
        );
    if (preference === EntryURLType.General || preference === EntryURLType.Login) {
        return Object.keys(urlRef)
            .sort((a, b) => {
                if (preference === EntryURLType.General) {
                    const general = /^ur[li]$/i;
                    const aVal = general.test(a) ? 1 : 0;
                    const bVal = general.test(b) ? 1 : 0;
                    return bVal - aVal;
                } else if (preference === EntryURLType.Login) {
                    const login = /login/i;
                    const aVal = login.test(a) ? 1 : 0;
                    const bVal = login.test(b) ? 1 : 0;
                    return bVal - aVal;
                }
                return 0;
            })
            .map((key) => urlRef[key]);
    } else if (preference === EntryURLType.Icon) {
        const iconProp = Object.keys(urlRef).find((key) => URL_PROP_ICON.test(key));
        return iconProp ? [urlRef[iconProp]] : [];
    }
    // Default is "any" URLs
    return objectValues(urlRef);
}
