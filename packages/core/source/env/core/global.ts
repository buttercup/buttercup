export function getGlobal(): typeof globalThis | Window {
    if (typeof window !== "undefined") {
        return window;
    } else if (typeof global !== "undefined") {
        return global;
    } else if (typeof self !== "undefined") {
        return self;
    }
    throw new Error("Unable to detect any global variable/context");
}
