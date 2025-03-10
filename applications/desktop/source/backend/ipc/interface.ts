import { BrowserWindow } from "electron";
import { IPCInterface } from "../types.js";
import { IPC, IPCHandlerContext } from "./types.js";
import { logInfo } from "../library/log.js";

type RegisteredHandler<Name extends keyof IPCInterface> = (
    this: IPCHandlerContext,
    ...args: Parameters<IPCInterface[Name]>
) => Promise<ReturnType<IPCInterface[Name]>>;

export function registerHandler<Name extends keyof IPCInterface>(
    ipc: IPC,
    name: Name,
    handler: RegisteredHandler<Name>
): void {
    ipc.handle(name, async (_, ...args: Parameters<IPCInterface[Name]>) => {
        logInfo(`Backend handler called: ${name}`);

        const win = BrowserWindow.fromWebContents(_.sender);
        return await handler.apply({ callerWindow: win }, args);
    });
}
