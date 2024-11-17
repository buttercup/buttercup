import { generateUUID } from "../tools/uuid.js";
import { credentialsAllowsPurpose, getCredentials, setCredentials } from "./memory/credentials.js";
import { getSharedAppEnv } from "../env/appEnv.js";
import { getMasterPassword, setMasterPassword } from "./memory/password.js";
import { CredentialsData, CredentialsPayload, DatasourceConfiguration } from "../types.js";

/**
 * The signature of legacy encrypted credentials
 * @private
 */
const LEGACY_SIGNING_KEY = "b~>buttercup/acreds.v2.";

/**
 * The signature of encrypted credentials
 * @private
 */
const SIGNING_KEY = "bc~3>";

/**
 * Sign encrypted content
 * @see SIGNING_KEY
 * @private
 * @param content The encrypted text
 * @returns The signed key
 */
function signEncryptedContent(content: string): string {
    return `${SIGNING_KEY}${content}`;
}

/**
 * Remove the signature from encrypted content
 * @private
 * @param content The encrypted text
 * @returns The unsigned encrypted key
 * @throws {Error} Throws if no SIGNING_KEY is detected
 * @see SIGNING_KEY
 */
function unsignEncryptedContent(content: string): string {
    const newIndex = content.indexOf(SIGNING_KEY);
    const oldIndex = content.indexOf(LEGACY_SIGNING_KEY);
    if (newIndex === -1 && oldIndex === -1) {
        throw new Error("Invalid credentials content (unknown signature)");
    }
    return newIndex === 0
        ? content.substr(SIGNING_KEY.length)
        : content.substr(LEGACY_SIGNING_KEY.length);
}

/**
 * Secure credentials storage/transfer class
 * - Allows for the safe transfer of credentials within the
 * Buttercup application environment. Will not allow
 * credentials to be shared or transferred outside of the
 * environment. Credential properties are stored in memory
 * and are inaccessible to public functions.
 */
export class Credentials {
    static PURPOSE_DECRYPT_VAULT = "vault-decrypt";
    static PURPOSE_ENCRYPT_VAULT = "vault-encrypt";
    static PURPOSE_SECURE_EXPORT = "secure-export";

    /**
     * Get all available purposes
     * @static
     */
    static allPurposes() {
        return [
            Credentials.PURPOSE_DECRYPT_VAULT,
            Credentials.PURPOSE_ENCRYPT_VAULT,
            Credentials.PURPOSE_SECURE_EXPORT
        ];
    }

    /**
     * Create a new Credentials instance using an existing Credentials
     * instance - This can be used to reset a credentials's purposes.
     * @param credentials A credentials instance
     * @param masterPassword The master password used to
     *  encrypt the instance being cloned
     * @throws {Error} Throws if no master password provided
     * @throws {Error} Throws if master password does not match
     *  original
     */
    static fromCredentials(credentials: Credentials, masterPassword: string): Credentials {
        if (!masterPassword) {
            throw new Error("Master password is required for credentials cloning");
        }
        const credentialsData = getCredentials(credentials.id);
        const credentialsPassword = getMasterPassword(credentials.id);
        if (credentialsPassword !== masterPassword) {
            throw new Error("Master password does not match that of the credentials to be cloned");
        }
        const newData = JSON.parse(JSON.stringify(credentialsData.data));
        return new Credentials(newData, masterPassword);
    }

    /**
     * Create a new Credentials instance from a Datasource configuration
     * @param datasourceConfig The configuration for the
     *  datasource - this usually includes the credential data used for
     *  authenticating against the datasource host platform.
     * @param masterPassword Optional master password to
     *  store alongside the credentials. Used to create secure strings.
     */
    static fromDatasource(
        datasourceConfig: DatasourceConfiguration,
        masterPassword: string = null
    ): Credentials {
        return new Credentials(
            {
                datasource: datasourceConfig
            },
            masterPassword
        );
    }

    /**
     * Create a new Credentials instance from a password
     * - uses the single password value as the master password stored
     * alongside the original password if no master password is
     * provided. The master password is used when generating secure
     * strings.
     * @param password The password to store
     * @param masterPassword Optional master password
     *  to store alongside the credentials. Used to create secure
     *  strings.
     */
    static fromPassword(password: string, masterPassword: string = null): Credentials {
        const masterPass = masterPassword || password;
        return new Credentials({ password }, masterPass);
    }

    /**
     * Create a new instance from a secure string
     * @param content Encrypted content
     * @param masterPassword The password for decryption
     * @returns A promise that resolves with the new instance
     */
    static async fromSecureString(content: string, masterPassword: string): Promise<Credentials> {
        const decrypt = getSharedAppEnv().getProperty("crypto/v1/decryptText");
        const decryptedContent = await decrypt(unsignEncryptedContent(content), masterPassword);
        const credentialsData = JSON.parse(decryptedContent);
        // Handle compatibility updates for legacy credentials
        if (credentialsData.datasource) {
            if (typeof credentialsData.datasource === "string") {
                credentialsData.datasource = JSON.parse(credentialsData.datasource);
            }
            // Move username and password INTO the datasource config, as
            // they relate to the remote connection/source
            if (credentialsData.username) {
                credentialsData.datasource.username = credentialsData.username;
                delete credentialsData.username;
            }
            if (credentialsData.password) {
                credentialsData.datasource.password = credentialsData.password;
                delete credentialsData.password;
            }
        }
        return new Credentials(credentialsData, masterPassword);
    }

    /**
     * Check if a value is an instance of Credentials
     * @param inst The value to check
     */
    static isCredentials(inst: Credentials | any): boolean {
        return (
            !!inst &&
            typeof inst === "object" &&
            typeof inst.toSecureString === "function" &&
            !!inst.id
        );
    }

    id: string;

    /**
     * Create a new Credentials instance
     * @param obj Object data representing some credentials
     * @param masterPassword Optional master password to store with
     *  the credentials data, which is used for generating secure strings.
     */
    constructor(obj: CredentialsData = {}, masterPassword: string = null) {
        const id = generateUUID();
        Object.defineProperty(this, "id", {
            writable: false,
            configurable: false,
            enumerable: true,
            value: id
        });
        setCredentials(id, {
            data: obj,
            purposes: Credentials.allPurposes(),
            open: false
        });
        setMasterPassword(id, masterPassword);
    }

    /**
     * Get raw credentials data (only available in specialised environments)
     * @returns Credentials data object, or null if not available
     */
    getCredentialsData(): CredentialsData | null {
        const isClosedEnv = getSharedAppEnv().getProperty("env/v1/isClosedEnv")();
        const payload = getCredentials(this.id);
        if (isClosedEnv || payload.open === true) {
            return payload.data;
        }
        return null;
    }

    /**
     * Get raw credentials data (only available in specialised environments)
     */
    getData(): CredentialsPayload | null {
        const isClosedEnv = getSharedAppEnv().getProperty("env/v1/isClosedEnv")();
        const payload = getCredentials(this.id);
        if (isClosedEnv || payload.open === true) {
            return payload;
        }
        return null;
    }

    /**
     * Restrict the purposes that this set of credentials
     * can be used for. Once a purpose is removed it can
     * no longer be added again to the same instance.
     * @param allowedPurposes An array of
     *  new allowed purposes. If a purpose mentioned is
     *  not currently permitted, it will be ignored.
     * @returns Returns self
     * @example
     *  credentials.restrictPurposes(
     *      Credentials.PURPOSE_SECURE_EXPORT
     *  );
     *  // credentials can only be exported to an
     *  // encrypted string, and not used for things
     *  // like encrypting datasource changes.
     */
    restrictPurposes(allowedPurposes: Array<string>): this {
        const creds = getCredentials(this.id);
        const { purposes } = creds;
        // Filter out purposes which have already been restricted
        const finalPurposes = allowedPurposes.filter((newPurpose) => purposes.includes(newPurpose));
        setCredentials(
            this.id,
            Object.assign(creds, {
                purposes: finalPurposes
            })
        );
        return this;
    }

    /**
     * Set the credential data
     * @param data The credentials data to overwrite the old with
     */
    setCredentialsData(data: CredentialsData): void {
        const isClosedEnv = getSharedAppEnv().getProperty("env/v1/isClosedEnv")();
        const payload = getCredentials(this.id);
        if (!isClosedEnv && payload.open !== true) {
            throw new Error("Unable to set data: Insecure environment and payload is not open");
        }
        const newPayload: CredentialsPayload = {
            ...payload,
            data
        };
        setCredentials(this.id, newPayload);
    }

    /**
     * Convert the credentials to an encrypted string, for storage
     * @returns A promise that resolves with the encrypted credentials
     * @throws {Error} Rejects when masterPassword is not a string
     * @throws {Error} Rejects if credentials don't permit secure export purposes
     */
    async toSecureString(): Promise<string> {
        if (credentialsAllowsPurpose(this.id, Credentials.PURPOSE_SECURE_EXPORT) !== true) {
            throw new Error("Credential purposes don't allow for secure exports");
        }
        const encrypt = getSharedAppEnv().getProperty("crypto/v1/encryptText");
        const { data } = getCredentials(this.id);
        const masterPassword = getMasterPassword(this.id);
        if (typeof masterPassword !== "string") {
            throw new Error(
                "Cannot convert Credentials to string: master password was not set or is invalid"
            );
        }
        return encrypt(JSON.stringify(data), masterPassword).then(signEncryptedContent);
    }

    /**
     * Get raw credentials data (only available in specialised environments)
     * @protected
     * @deprecated
     */
    _getData() {
        return this.getData();
    }
}
