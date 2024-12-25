import { ipcRenderer } from "electron";
import { IPCInterface } from "../../shared/types.js";

export async function executeIPCHandler<Name extends keyof IPCInterface>(
    name: Name,
    ...args: Parameters<IPCInterface[Name]>
): Promise<ReturnType<IPCInterface[Name]>> {
    return await ipcRenderer.invoke(name, ...args);
}
