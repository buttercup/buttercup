import { VaultFormatA } from "./VaultFormatA.js";
import { VaultFormatB } from "./VaultFormatB.js";
import { hasValidSignature as isFormatBSigned } from "./formatB/signing.js";
import { VaultFormatID } from "../types.js";

const DEFAULT_FORMAT = VaultFormatB;

let __defaultFormat = DEFAULT_FORMAT;

export function detectFormat(encryptedContent: string): any {
    if (isFormatBSigned(encryptedContent)) {
        return VaultFormatB;
    }
    return VaultFormatA;
}

export function getDefaultFormat(): any {
    return __defaultFormat;
}

export function getFormatForID(id: VaultFormatID): any {
    if (id === VaultFormatID.B) {
        return VaultFormatB;
    }
    return VaultFormatA;
}

export function setDefaultFormat(Format: any = null) {
    __defaultFormat = Format || DEFAULT_FORMAT;
}
