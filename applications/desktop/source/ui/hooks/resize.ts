import { useEffect, useState } from "react";

export function useWidth(target: HTMLElement | null) {
    const [width, setWidth] = useState<number>(target?.offsetWidth ?? 0);

    useEffect(() => {
        if (!target) return;

        const onSizeChange = () => {
            setWidth(target.offsetWidth);
        };
        const observer = new ResizeObserver(onSizeChange);
        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [target]);

    return width;
}
