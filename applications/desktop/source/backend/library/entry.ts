import { Entry, EntryURLType, getEntryURLs } from "@buttercup/core";
import { extractDomain } from "./url.js";

export function getEntryDomain(entry: Entry): string | null {
    const properties = entry.getProperties();
    const [url] = [
        ...getEntryURLs(properties, EntryURLType.Icon),
        ...getEntryURLs(properties, EntryURLType.Any)
    ];
    return url ? extractDomain(url) : null;
}
