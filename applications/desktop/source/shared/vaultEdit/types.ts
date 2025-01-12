import { EntryFacade, EntryID, EntryType } from "@buttercup/core";

export interface VaultEditInterface {
    getAllEntryDetails: () => Promise<
        Array<{
            icon: null | {
                domain: string;
                type: "domain";
            };
            id: EntryID;
            title: string;
            type: EntryType;
        }>
    >;
    getEntry: (entryID: EntryID) => Promise<EntryFacade | null>;
}
