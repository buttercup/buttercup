import { Entry } from "../core/Entry.js";
import { BaseSearch, ProcessedSearchEntry, SearcherFactory } from "./BaseSearch.js";
import { EntryURLType, getEntryURLs } from "../tools/entry.js";
import { fieldsToAttributes, fieldsToProperties } from "../facades/entry.js";
import { StorageInterface } from "../storage/StorageInterface.js";
import { EntryFacade, VaultFacade } from "../types.js";
import { isValidTag } from "../tools/tag.js";

async function extractEntries(
    facade: VaultFacade,
    memory: StorageInterface
): Promise<Array<ProcessedSearchEntry>> {
    // Get scores
    const scoresRaw = await memory.getValue(`bcup_search_${facade.id}`);
    let vaultScore = {};
    if (scoresRaw) {
        try {
            const scores = JSON.parse(scoresRaw);
            vaultScore = scores;
        } catch (err) {}
    }
    // Get entries
    return facade.entries.reduce((entries: Array<ProcessedSearchEntry>, nextEntry: EntryFacade) => {
        // @todo in trash
        const attributes = fieldsToAttributes(nextEntry.fields);
        const tags = attributes[Entry.Attributes.Tags]
            ? attributes[Entry.Attributes.Tags].split(",").reduce((output, tag) => {
                  return isValidTag(tag) ? [...output, tag] : output;
              }, [])
            : [];
        const properties = fieldsToProperties(nextEntry.fields);
        const urls = getEntryURLs(properties, EntryURLType.General);
        entries.push({
            domainScores: vaultScore[nextEntry.id] || {},
            entryType: nextEntry.type,
            groupID: nextEntry.parentID,
            id: nextEntry.id,
            properties,
            tags,
            urls,
            vaultID: facade.id
        });
        return entries;
    }, []);
}

export class VaultFacadeEntrySearch extends BaseSearch {
    constructor(
        facades: Array<VaultFacade>,
        memory?: StorageInterface,
        searcherFactory?: SearcherFactory
    ) {
        super(facades, extractEntries, memory, searcherFactory);
    }
}
