export function assignObjImmutableProp(obj: Object, name: string, value: any) {
    Object.defineProperty(obj, name, {
        value,
        writable: false,
        configurable: false,
        enumerable: false
    });
}
