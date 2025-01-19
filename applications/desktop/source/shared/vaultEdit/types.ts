import { EntryFacade, EntryID, EntryType, GroupFacade, GroupID } from "@buttercup/core";

export interface EntryDetails {
    icon: null | {
        domain: string;
        type: "domain";
    };
    id: EntryID;
    title: string;
    type: EntryType;
}

export interface VaultEditInterface {
    getAllEntryDetails: () => Promise<Array<EntryDetails>>;
    getAllGroups: () => Promise<Array<GroupFacade>>;
    getEntry: (entryID: EntryID) => Promise<EntryFacade | null>;
    getGroupEntryDetails: (groupID: GroupID) => Promise<Array<EntryDetails>>;
}
