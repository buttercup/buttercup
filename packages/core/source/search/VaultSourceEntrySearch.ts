import { SearchResult, SearcherFactory } from "./BaseSearch.js";
import { VaultSource } from "../core/VaultSource.js";
import { Vault } from "../core/Vault.js";
import { StorageInterface } from "../storage/StorageInterface.js";
import { VaultEntrySearch } from "./VaultEntrySearch.js";
import { VaultSourceStatus } from "../types.js";

export class VaultSourceEntrySearch extends VaultEntrySearch {
    _sources: Array<VaultSource>;

    constructor(
        sources: Array<VaultSource>,
        memory?: StorageInterface,
        searcherFactory?: SearcherFactory
    ) {
        const vaults: Array<Vault> = sources.reduce((output, source) => {
            if (source.status === VaultSourceStatus.Unlocked) {
                return [...output, source.vault];
            }
            return output;
        }, []);
        super(vaults, memory, searcherFactory);
        this._sources = [...sources];
    }

    /**
     * Last search results
     * @deprecated Use `getResults` instead
     */
    get results(): Array<SearchResult> {
        return this.getResults();
    }

    /**
     * Get last search results
     * @returns An array of results
     */
    getResults(): Array<SearchResult> {
        return super.getResults().map((res) => {
            const output = res;
            const source = this._sources.find((src) => src?.vault?.id === output.vaultID);
            if (source) {
                output.sourceID = source.id;
            }
            return output;
        });
    }

    /**
     * Search for entries by term
     * @param term The term to search for
     * @returns An array of search results
     */
    searchByTerm(term: string): Array<SearchResult> {
        const results = super.searchByTerm(term);
        return results.map((res) => {
            const output = res;
            const source = this._sources.find((src) => src?.vault?.id === output.vaultID);
            if (source) {
                output.sourceID = source.id;
            }
            return output;
        });
    }

    /**
     * Search for entries by URL
     * @param url The URL to search with
     * @returns An array of search results
     */
    searchByURL(url: string): Array<SearchResult> {
        const results = super.searchByURL(url);
        return results.map((res) => {
            const output = res;
            const source = this._sources.find((src) => src?.vault?.id === output.vaultID);
            if (source) {
                output.sourceID = source.id;
            }
            return output;
        });
    }
}
