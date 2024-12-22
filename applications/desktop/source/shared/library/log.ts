import StackTracey from "stacktracey";

export function serialiseLogItems(items: Array<any>): string {
    return items
        .reduce((output: string, next: any) => {
            let value: string = "";
            if (["number", "boolean", "string"].indexOf(typeof next) >= 0) {
                value = `${next}`;
            } else if (next instanceof Date) {
                value = next.toISOString();
            } else if (next instanceof Error) {
                const stack = new StackTracey(next);
                value = `${next.toString()}\n${stack.withSources().asTable()}`;
            } else if (typeof next === "undefined" || next === null) {
                // Do nothing
            } else {
                value = JSON.stringify(next);
            }
            return `${output} ${value}`;
        }, "")
        .trim();
}
