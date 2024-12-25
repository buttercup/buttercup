import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { assertError } from "layerr";
import { StorageInterface } from "@buttercup/core";
import { ChannelQueue } from "@buttercup/channel-queue";
import { naiveClone } from "../../../shared/library/clone.js";

const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export class FileStorage extends StorageInterface {
    protected _queue: ChannelQueue;
    protected _path: string;

    constructor(filePath: string) {
        super();
        this._path = filePath;
        this._queue = new ChannelQueue();
    }

    async getAllKeys(): Promise<Array<string>> {
        const data = await this._getContents();
        return Object.keys(data);
    }

    async getValue(name: string): Promise<any | null> {
        const data = await this._getContents();
        return typeof data[name] !== "undefined" ? data[name] : null;
    }

    async getValues(
        properties?: Array<string>
    ): Promise<Record<string, unknown>> {
        const data = await this._getContents();
        if (!Array.isArray(properties)) {
            return { ...data };
        }
        const result = properties.reduce(
            (output, key) => ({
                ...output,
                [key]: data[key]
            }),
            {}
        );
        return naiveClone(result);
    }

    async removeKey(name: string): Promise<void> {
        return this._queue.channel("update").enqueue(async () => {
            const data = await this._getContents();
            delete data[name];
            await this._putContents(data);
        });
    }

    async setValue(name: string, value: any): Promise<void> {
        return this._queue.channel("update").enqueue(async () => {
            const data = await this._getContents();
            data[name] = value;
            await this._putContents(data);
        });
    }

    async setValues(values: Record<string, any>): Promise<void> {
        return this._queue.channel("update").enqueue(async () => {
            const data = await this._getContents();
            for (const key in values) {
                data[key] = values[key];
            }
            await this._putContents(data);
        });
    }

    async _getContents(): Promise<Record<string, unknown>> {
        return this._queue.channel("io").enqueue(
            async () => {
                try {
                    const data = await readFile(this._path, "utf-8");
                    return JSON.parse(data);
                } catch (err) {
                    assertError(err);
                    if ((err as any).code === "ENOENT") {
                        // No file
                        return {};
                    }
                    // Other error
                    throw err;
                }
            },
            undefined,
            "read"
        );
    }

    async _putContents(data: Object): Promise<void> {
        return this._queue.channel("io").enqueue(async () => {
            await mkdir(path.dirname(this._path), { recursive: true });
            await writeFile(this._path, JSON.stringify(data));
        });
    }
}
