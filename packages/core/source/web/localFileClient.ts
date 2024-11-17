import joinURL from "url-join";
import { getSharedAppEnv } from "../env/appEnv.js";

const BASE_URL = "http://localhost:12821";

export function buildClient(token: string) {
    const encrypt = getSharedAppEnv().getProperty("crypto/v1/encryptText");
    const decrypt = getSharedAppEnv().getProperty("crypto/v1/decryptText");
    return {
        readdir: (remotePath, callback) => {
            const url = joinURL(BASE_URL, "/get/directory");
            encrypt(remotePath, token)
                .then((payload) =>
                    fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json; charset=utf-8"
                        },
                        body: JSON.stringify({
                            payload
                        })
                    })
                )
                .then((response) => {
                    if (response.ok && response.status === 200) {
                        return response.json();
                    }
                    throw new Error(`Failed reading remote file: ${remotePath}`);
                })
                .then((response) => decrypt(response.payload, token))
                .then(JSON.parse)
                .then((results) => callback(null, results))
                .catch(callback);
        },

        readFile: (remotePath, options, callback) => {
            const encrypt = getSharedAppEnv().getProperty("crypto/v1/encryptText");
            const decrypt = getSharedAppEnv().getProperty("crypto/v1/decryptText");
            const cb = typeof options === "function" ? options : callback;
            const url = joinURL(BASE_URL, "/get/file");
            encrypt(remotePath, token)
                .then((payload) =>
                    fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json; charset=utf-8"
                        },
                        body: JSON.stringify({
                            payload
                        })
                    })
                )
                .then((response) => {
                    if (response.ok && response.status === 200) {
                        return response.json();
                    }
                    throw new Error(`Failed reading remote file: ${remotePath}`);
                })
                .then((response) => decrypt(response.payload, token))
                .then((data) => {
                    cb(null, data);
                })
                .catch(cb);
        },

        writeFile: (remotePath, data, options, callback) => {
            const encrypt = getSharedAppEnv().getProperty("crypto/v1/encryptText");
            const cb = typeof options === "function" ? options : callback;
            if (typeof data !== "string") {
                throw new Error("Failed writing file: Expected data to be of type string");
            }
            const url = joinURL(BASE_URL, "/put/file");
            encrypt(
                JSON.stringify({
                    filename: remotePath,
                    contents: data
                }),
                token
            )
                .then((payload) =>
                    fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json; charset=utf-8"
                        },
                        body: JSON.stringify({
                            payload
                        })
                    })
                )
                .then((response) => {
                    if (response.ok && response.status === 200) {
                        cb();
                        return;
                    }
                    throw new Error(`Failed writing remote file: ${remotePath}`);
                })
                .catch(cb);
        }
    };
}

export function completeConnection(code: string): Promise<string> {
    if (!code) {
        return Promise.reject(new Error("Code is required"));
    }
    const decrypt = getSharedAppEnv().getProperty("crypto/v1/decryptText");
    const codeURL = joinURL(BASE_URL, `/connect/${code}`);
    return fetch(codeURL)
        .then((response) => response.json())
        .then((resp) => {
            if (resp.status !== "ok") {
                throw new Error("Connection response status was not OK");
            }
            const { payload } = resp;
            return decrypt(payload, code);
        });
}

export function initiateConnection(): Promise<void> {
    const pingURL = BASE_URL;
    const connectURL = joinURL(BASE_URL, "/connect");
    return fetch(pingURL)
        .then((response) => response.json())
        .then((response) => {
            if (response.status !== "ok") {
                throw new Error("Received non-OK status");
            } else if (!response.ready) {
                throw new Error("Endpoint is not yet ready");
            }
            return fetch(connectURL)
                .then((response) => response.json())
                .then((response) => {
                    if (response.status !== "ok") {
                        throw new Error("Endpoint connection procedure failed");
                    }
                });
        });
}
