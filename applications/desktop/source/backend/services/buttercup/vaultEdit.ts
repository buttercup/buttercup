import { VaultSourceID, VaultSourceStatus } from "@buttercup/core";
import { getVaultManager } from "./management.js";
import { VaultEditInterface } from "../../../shared/vaultEdit/types.js";
import { getEntryDomain } from "../../library/entry.js";

export async function getAllEntryDetails(
    sourceID: VaultSourceID
): ReturnType<VaultEditInterface["getAllEntryDetails"]> {
    const vaultMgr = getVaultManager();

    const source = vaultMgr.getSourceForID(sourceID);
    if (!source) {
        throw new Error(`No vault source found for ID: ${sourceID}`);
    }
    if (source.status !== VaultSourceStatus.Unlocked) {
        throw new Error(`Vault source not in unlocked state: ${sourceID}`);
    }

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
