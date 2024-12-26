import { useCallback, useMemo, useRef, useState } from "react";
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

// export function useIPCCall<Name extends keyof IPCInterface>(name: Name): IPCCallHookResult<Name>;
// export function useIPCCall<Name extends keyof IPCInterface>(name: Name, callback: IPCCallback<Name>): IPCCallHookResult<Name>;
// export function useIPCCall<Name extends keyof IPCInterface>(name: Name, callback: IPCCallback<Name>): IPCCallHookResult<Name>;
export function useIPCCall<Name extends keyof IPCInterface>(
    name: Name,
    callback: IPCCallback<Name> | null = null
): IPCCallHookResult<Name> {
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
    }, [name, callback, status]);

    return useMemo(() => ({
        error,
        execute,
        result,
        status
    }), [error, execute, result, status]);
}

export function useRepeatingIPCCall<Name extends keyof IPCInterface>(
    name: Name,
    args: Parameters<IPCInterface[Name]>,
    delayMs: number
): IPCCallHookResult<Name> {
    const executeRef = useRef<IPCCallHookResult<Name>["execute"]>(() => {});
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const timerHandler = useCallback(() => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            executeRef.current(...args);
        }, delayMs);
    }, [delayMs, args]);

    const output = useIPCCall(name, timerHandler);
    executeRef.current = output.execute;

    return output;
}
