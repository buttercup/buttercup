import { createAdapter } from "iocane";
import cryptoRandomString from "crypto-random-string";
import { CRYPTO_PBKDF2_ROUNDS, CRYPTO_RANDOM_STRING_CHARS } from "../core/constants.js";

let __derivationRoundsOverride = CRYPTO_PBKDF2_ROUNDS;

function decryptData(data: string | Buffer, password: string): Promise<string | Buffer> {
    return createAdapter().decrypt(data, password) as Promise<string | Buffer>;
}

function encryptData(data: string | Buffer, password: string): Promise<string | Buffer> {
    const adapter = createAdapter();
    if (__derivationRoundsOverride > 0) {
        adapter.setDerivationRounds(__derivationRoundsOverride);
    }
    return adapter.encrypt(data, password) as Promise<string | Buffer>;
}

export function getCryptoResources() {
    return {
        "crypto/v2/decryptBuffer": decryptData,
        "crypto/v2/encryptBuffer": encryptData,
        "crypto/v1/decryptText": decryptData,
        "crypto/v1/encryptText": encryptData,
        "crypto/v1/randomString": randomString,
        "crypto/v1/setDerivationRounds": setDerivationRounds
    };
}

async function randomString(length: number): Promise<string> {
    return cryptoRandomString({
        length,
        characters: CRYPTO_RANDOM_STRING_CHARS
    });
}

function setDerivationRounds(rounds: number = null) {
    __derivationRoundsOverride = !rounds ? CRYPTO_PBKDF2_ROUNDS : rounds;
}
