import { useCallback, useMemo, useState } from "react";
import { IPCInterface } from "../../shared/types.js";
import { executeIPCHandler } from "../ipc/handler.js";

type IPCCallback<Name extends keyof IPCInterface> = (error: string | null, result: ReturnType<IPCInterface[Name]> | null) => void;
interface IPCCallHookResult<Name extends keyof IPCInterface> {
    error: string | null;
    execute: (...args: Parameters<IPCInterface[Name]>) => void;
    result: ReturnType<IPCInterface[Name]> | null;
    status: Status;
};
type Status = "idle" | "running";

export function useIPCCall<Name extends keyof IPCInterface>(name: Name): IPCCallHookResult<Name>;
export function useIPCCall<Name extends keyof IPCInterface>(name: Name, callback: IPCCallback<Name>): IPCCallHookResult<Name>;
export function useIPCCall<Name extends keyof IPCInterface>(name: Name, callback: IPCCallback<Name>, dependencies: Array<unknown>): IPCCallHookResult<Name>;
export function useIPCCall<Name extends keyof IPCInterface>(
    name: Name,
    callbackOrDependencies: IPCCallback<Name> | Array<unknown> = [],
    maybeDependencies: Array<unknown> = []
): IPCCallHookResult<Name> {
    const callback = typeof callbackOrDependencies === "function" ? callbackOrDependencies : null;
    const dependencies = Array.isArray(callbackOrDependencies) ? callbackOrDependencies : maybeDependencies;

    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ReturnType<IPCInterface[Name]> | null>(null);

    const execute = useCallback((...args: Parameters<IPCInterface[Name]>) => {
        if (status !== "idle") return;
        setError(null);
        setResult(null);
        setStatus("running");

        executeIPCHandler(name, ...args)
            .then(newResult => {
                setStatus("idle");
                setResult(newResult);

                if (callback) {
                    callback(null, newResult);
                }
            })
            .catch(err => {
                setError(err.message);
                setStatus("idle");

                if (callback) {
                    callback(err.message, null);
                }
            });
    }, [name, callback, status, ...dependencies]);

    return useMemo(() => ({
        error,
        execute,
        result,
        status
    }), [error, execute, result, status]);
}
