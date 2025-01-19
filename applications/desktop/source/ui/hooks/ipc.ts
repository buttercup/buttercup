import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IPCInterface } from "../../shared/types.js";
import { executeIPCHandler } from "../ipc/handler.js";

type IPCCallback<Name extends keyof IPCInterface> = (
    error: string | null,
    result: ReturnType<IPCInterface[Name]> | null
) => void;
interface IPCCallHookResult<Name extends keyof IPCInterface> {
    error: string | null;
    execute: (...args: Parameters<IPCInterface[Name]>) => void;
    result: ReturnType<IPCInterface[Name]> | null;
    status: Status;
}
type Status = "idle" | "running";

export function useIPCCall<Name extends keyof IPCInterface>(
    name: Name,
    callback: IPCCallback<Name> | null = null
): IPCCallHookResult<Name> {
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ReturnType<IPCInterface[Name]> | null>(
        null
    );

    const runningRef = useRef<boolean>(false);

    const execute = useCallback(
        (...args: Parameters<IPCInterface[Name]>) => {
            if (runningRef.current) return;
            setError(null);
            setResult(null);
            setStatus("running");
            runningRef.current = true;

            executeIPCHandler(name, ...args)
                .then((newResult) => {
                    setStatus("idle");
                    runningRef.current = false;
                    setResult(newResult);

                    if (callback) {
                        callback(null, newResult);
                    }
                })
                .catch((err) => {
                    setError(err.message);
                    setStatus("idle");
                    runningRef.current = false;

                    if (callback) {
                        callback(err.message, null);
                    }
                });
        },
        [name, callback]
    );

    return useMemo(
        () => ({
            error,
            execute,
            result,
            status
        }),
        [error, execute, result, status]
    );
}

export function useRepeatingIPCCall<Name extends keyof IPCInterface>(
    name: Name,
    args: Parameters<IPCInterface[Name]>,
    delayMs: number
): IPCCallHookResult<Name> {
    const executeRef = useRef<IPCCallHookResult<Name>["execute"]>(() => {});
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [result, setResult] = useState<ReturnType<IPCInterface[Name]> | null>(
        null
    );

    const timerHandler = useCallback(
        (
            error: string | null,
            value: ReturnType<IPCInterface[Name]> | null
        ) => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
            }

            if (error === null) {
                setResult(value);
            }

            timerRef.current = setTimeout(() => {
                executeRef.current(...args);
            }, delayMs);
        },
        [delayMs, args]
    );

    const ipcCallOutput = useIPCCall(name, timerHandler);
    executeRef.current = ipcCallOutput.execute;

    const output = useMemo(
        () => ({
            ...ipcCallOutput,
            result
        }),
        [ipcCallOutput, result]
    );

    useEffect(() => {
        executeRef.current(...args);
    }, []);

    return output;
}
