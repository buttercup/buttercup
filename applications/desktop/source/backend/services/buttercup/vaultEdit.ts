import { createEntryFacade, createGroupFacade, EntryID, GroupID, VaultSource, VaultSourceID, VaultSourceStatus } from "@buttercup/core";
import { getVaultManager } from "./management.js";
import { VaultEditInterface } from "../../../shared/vaultEdit/types.js";
import { getEntryDomain } from "../../library/entry.js";

export async function getAllEntryDetails(
    sourceID: VaultSourceID
): ReturnType<VaultEditInterface["getAllEntryDetails"]> {
    const source = getUnlockedSource(sourceID);

    return source.vault.getAllEntries().map((entry) => {
        const title = entry.getProperty("title") ?? "";
        const domain = getEntryDomain(entry);

        return {
            icon: domain
                ? {
                      domain,
                      type: "domain"
                  }
                : null,
            id: entry.id,
            title,
            type: entry.getType()
        };
    });
}

export async function getAllGroups(
    sourceID: VaultSourceID
): ReturnType<VaultEditInterface["getAllGroups"]> {
    const source = getUnlockedSource(sourceID);

    const groups = source.vault.getAllGroups();
    return groups.map(group => createGroupFacade(group));
}

export async function getEntry(sourceID: VaultSourceID, entryID: EntryID): ReturnType<VaultEditInterface["getEntry"]> {
    const source = getUnlockedSource(sourceID);

    const entry = source.vault.findEntryByID(entryID);
    if (!entry) return null;

    return createEntryFacade(entry);
}

export async function getGroupEntryDetails(
    sourceID: VaultSourceID,
    groupID: GroupID
): ReturnType<VaultEditInterface["getGroupEntryDetails"]> {
    const source = getUnlockedSource(sourceID);

    const group = source.vault.findGroupByID(groupID);
    if (!group) return [];

    return group.getEntries().map((entry) => {
        const title = entry.getProperty("title") ?? "";
        const domain = getEntryDomain(entry);

        return {
            icon: domain
                ? {
                      domain,
                      type: "domain"
                  }
                : null,
            id: entry.id,
            title,
            type: entry.getType()
        };
    });
}

function getUnlockedSource(sourceID: VaultSourceID): VaultSource {
    const vaultMgr = getVaultManager();

    const source = vaultMgr.getSourceForID(sourceID);
    if (!source) {
        throw new Error(`No vault source found for ID: ${sourceID}`);
    }
    if (source.status !== VaultSourceStatus.Unlocked) {
        throw new Error(`Vault source not in unlocked state: ${sourceID}`);
    }

    return source;
}
