import { createClient } from "webdav";
import { DropboxClient } from "@buttercup/dropbox-client";

export function getNetResources() {
    return {
        "net/dropbox/v1/newClient": (token: string) =>
            new DropboxClient(token, {
                compat: true,
                compatCorsHack: false
            }),
        "net/webdav/v1/newClient": createClient
    };
}
