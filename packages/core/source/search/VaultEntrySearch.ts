import { BaseSearch, ProcessedSearchEntry, SearcherFactory } from "./BaseSearch.js";
import { Vault } from "../core/Vault.js";
import { Entry } from "../core/Entry.js";
import { EntryURLType, getEntryURLs } from "../tools/entry.js";
import { StorageInterface } from "../storage/StorageInterface.js";

async function extractEntries(
    vault: Vault,
    memory: StorageInterface
): Promise<Array<ProcessedSearchEntry>> {
    // Get scores
    const scoresRaw = await memory.getValue(`bcup_search_${vault.id}`);
    let vaultScore = {};
    if (scoresRaw) {
        try {
            const scores = JSON.parse(scoresRaw);
            vaultScore = scores;
        } catch (err) {}
    }
    // Get entries
    return vault
        .getAllEntries()
        .filter((entry: Entry) => entry.isInTrash() === false)
        .map((entry: Entry) => {
            const properties = entry.getProperties();
            const urls = getEntryURLs(properties, EntryURLType.General);
            return {
                domainScores: vaultScore[entry.id] || {},
                entryType: entry.getType(),
                groupID: entry.getGroup().id,
                id: entry.id,
                properties,
                tags: entry.getTags(),
                urls,
                vaultID: vault.id
            };
        });
}

export class VaultEntrySearch extends BaseSearch {
    constructor(
        vaults: Array<Vault>,
        memory?: StorageInterface,
        searcherFactory?: SearcherFactory
    ) {
        super(vaults, extractEntries, memory, searcherFactory);
    }
}
