import { getCredentials } from "../credentials/memory/credentials.js";
import { getMasterPassword } from "../credentials/memory/password.js";
import { Credentials } from "../credentials/Credentials.js";
import { TextDatasource } from "./TextDatasource.js";

const __datasources = {};
const __datasourceFlags = {};
const __postHandlers = [];

/**
 * Convert a Credentials instance to a Datasource
 * @param credentials A Credentials instance that
 *  contains a datasource configuration
 * @throws {Error} Throws if no datasource configuration in
 *  credentials
 * @throws {Error} Throws if no type specified in datasource
 *  configuration
 * @throws {Error} Throws if no datasource found for type
 * @private
 */
export function credentialsToDatasource(credentials: Credentials): TextDatasource {
    const { datasource } = getCredentials(credentials.id).data;
    if (!datasource) {
        throw new Error("No datasource configuration in credentials");
    }
    const { type } = datasource;
    if (!type) {
        throw new Error("No datasource type specified in datasource configuration");
    }
    const DSClass = __datasources[type];
    if (!DSClass) {
        throw new Error(`No datasource found for type: ${type}`);
    }
    return new DSClass(prepareDatasourceCredentials(credentials));
}

/**
 * Execute all datasource postprocessors
 * @param type The type of datasource
 * @param datasource The datasource instance
 * @private
 */
export function fireInstantiationHandlers(type: string, datasource: TextDatasource) {
    __postHandlers.forEach((handler) => {
        try {
            handler(type, datasource);
        } catch (err) {
            console.error("Failed executing a datasource instantiation handler for a datasource");
            console.error(err);
        }
    });
}

/**
 * Prepare credentials for passing to a datasource
 * (from VaultSource)
 * @param credentials
 * @private
 */
export function prepareDatasourceCredentials(
    credentials: Credentials,
    typeOverride: string = null
): Credentials {
    const {
        data: { datasource }
    } = getCredentials(credentials.id);
    const masterPassword = getMasterPassword(credentials.id);
    const datasourceType = typeOverride || datasource.type || "";
    const { open = false } = __datasourceFlags[datasourceType] || {};
    if (!open) {
        return credentials;
    }
    const newCreds = Credentials.fromCredentials(credentials, masterPassword);
    const newCredPayload = getCredentials(newCreds.id);
    newCredPayload.open = true;
    return newCreds;
}

/**
 * Register a new datasource
 * This is called internally by the built-in datasources, but should be called if a
 * custom datasource is used.
 * @param datasourceType The name (slug) of the datasource
 * @param DSClass The class for the new datasource
 * @memberof module:Buttercup
 */
export function registerDatasource(datasourceType: string, DSClass: any, flags = {}) {
    if (__datasources[datasourceType]) {
        throw new Error(`Datasource already registered for type: ${datasourceType}`);
    }
    __datasources[datasourceType] = DSClass;
    __datasourceFlags[datasourceType] = flags;
}

interface DatasourcePostProcessorHandler {
    remove: () => void;
}

/**
 * Register a post-processor for a datasource being instantiated
 * @param {Function} callback The callback to execute with the instantiated datasource
 * @returns The result of the registration
 * @private
 */
export function registerDatasourcePostProcessor(
    callback: Function
): DatasourcePostProcessorHandler {
    __postHandlers.push(callback);
    return {
        remove: () => {
            const ind = __postHandlers.indexOf(callback);
            if (ind >= 0) {
                __postHandlers.splice(ind, 1);
            }
        }
    };
}
