import Fuse from "fuse.js";

export interface SearchKey {
    name: string;
    weight: number;
}

const SEARCH_PARAMS_DEFAULT: Array<SearchKey> = [
    {
        name: "properties.title",
        weight: 0.6
    },
    {
        name: "properties.username",
        weight: 0.25
    },
    {
        name: "urls",
        weight: 0.15
    }
];

export function buildSearcher(items: Array<any>, keys: Array<SearchKey> = SEARCH_PARAMS_DEFAULT) {
    return new Fuse(items, {
        includeScore: true,
        keys,
        shouldSort: true,
        threshold: 0.5
    });
}
