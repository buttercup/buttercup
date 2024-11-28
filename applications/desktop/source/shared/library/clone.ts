export function naiveClone<T extends { [key: string]: any }>(obj: T): T {
    const clone = { ...obj };
    for (const key in clone) {
        if (Array.isArray(clone[key])) {
            clone[key] = clone[key].map((value: Extract<keyof T, string>) => {
                if (typeof value === "object" && value) {
                    return naiveClone(value);
                }
                return value;
            });
        } else if (typeof clone[key] === "object" && clone[key]) {
            clone[key] = naiveClone(clone[key]);
        }
    }
    return clone;
}
