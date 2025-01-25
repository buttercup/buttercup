function isPrimitive(obj: unknown): boolean {
    return obj !== Object(obj);
}

export function naiveDeepEqual(val1: unknown, val2: unknown): boolean {
    if (val1 === val2) return true;

    if (isPrimitive(val1) && isPrimitive(val2)) {
        return val1 === val2;
    }

    const obj1 = val1 as Record<string, unknown>;
    const obj2 = val2 as Record<string, unknown>;

    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
    }

    for (let key in obj1) {
        if (!(key in obj2)) return false;
        if (!naiveDeepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
}
