import { getSharedAppEnv } from "../env/appEnv.js";
import { getMasterPassword } from "../credentials/memory/password.js";
import { Credentials } from "../credentials/Credentials.js";
import { BufferLike } from "../types.js";

export const ATTACHMENT_EXT = "bcatt";

export function decryptAttachment(buff: BufferLike, credentials: Credentials): Promise<BufferLike> {
    const masterPassword = getMasterPassword(credentials.id);
    const decrypt = getSharedAppEnv().getProperty("crypto/v2/decryptBuffer");
    return decrypt(buff, masterPassword);
}

export function encryptAttachment(buff: BufferLike, credentials: Credentials): Promise<BufferLike> {
    const masterPassword = getMasterPassword(credentials.id);
    const encrypt = getSharedAppEnv().getProperty("crypto/v2/encryptBuffer");
    return encrypt(buff, masterPassword);
}

export function getBufferSize(buff: BufferLike): number {
    if (typeof buff.byteLength !== "undefined") {
        return buff.byteLength;
    }
    return (<Buffer>buff).length;
}
