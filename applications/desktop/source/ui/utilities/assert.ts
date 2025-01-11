type Truthy<T> = Exclude<T, 0 | "" | false | null | undefined>;

class AssertionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AssertionError";
    }
}

export function assert<T>(
    value: T,
    message: string
): asserts value is Truthy<T> {
    if (!value) {
        throw new AssertionError(message);
    }
}
