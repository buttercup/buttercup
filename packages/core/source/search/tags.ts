export function extractTagsFromSearchTerm(term: string): {
    tags: Array<string>;
    term: string;
} {
    const searchItems: Array<string> = [];
    const tags = new Set<string>();
    const parts = term.split(/\s+/g);
    for (const part of parts) {
        if (/^#.+/.test(part)) {
            const raw = part.replace(/^#/, "");
            tags.add(raw.toLowerCase());
        } else if (part.length > 0) {
            searchItems.push(part);
        }
    }
    return {
        tags: [...tags],
        term: searchItems.join(" ").trim()
    };
}

export function tagsMatchSearch(searchTags: Array<string>, entryTags: Array<string>): boolean {
    return searchTags.every((searchTag) =>
        entryTags.some((entryTag) => entryTag.indexOf(searchTag) === 0)
    );
}
