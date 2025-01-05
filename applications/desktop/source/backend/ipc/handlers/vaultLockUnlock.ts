import { VaultSourceID } from "@buttercup/core";
import { lockVaultSource, unlockVaultSource } from "../../services/buttercup/lockUnlock.js";
import { registerHandler } from "../interface.js";
import { IPC } from "../types.js";

export function registerLockUnlockHandlers(ipc: IPC) {
    registerHandler(ipc, "lock_vault", async function(sourceID: VaultSourceID) {
        await lockVaultSource(sourceID);
    });

    registerHandler(ipc, "unlock_vault", async function(sourceID: VaultSourceID, password: string) {
        await unlockVaultSource(sourceID, password);
    });
}
