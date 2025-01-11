import { DependencyList, useEffect, useMemo, useRef, useState } from "react";
import { logErr } from "../library/log.js";

export function useAsync<Output>(
    method: () => Promise<Output>,
    dependencies: DependencyList = []
): {
    error: Error | null;
    result: Output | null;
    running: boolean;
    runs: number;
} {
    const [result, setResult] = useState<Output | null>(null);
    const [runs, setRuns] = useState<number>(0);
    const [running, setRunning] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const runLock = useRef<boolean>(false);

    useEffect(() => {
        if (runLock.current) return;
        runLock.current = true;

        setRunning(true);
        setError(null);
        method()
            .then((newResult) => {
                runLock.current = false;
                setRunning(false);

                setResult(newResult);
                setRuns((previous) => previous + 1);
            })
            .catch((err) => {
                runLock.current = false;
                setRunning(false);

                logErr("Async hook method returned an error", err);
                setError(err);

                setRuns((previous) => previous + 1);
            });
    }, [method, ...dependencies]);

    return useMemo(
        () => ({
            error,
            result,
            runs,
            running
        }),
        [error, result, runs, running]
    );
}
