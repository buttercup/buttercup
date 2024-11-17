import { assignObjImmutableProp } from "./prop.js";

export interface AppEnv {
    getProperty: AppEnvGetPropertyMethod;
    hasProperty: AppEnvHasPropertyMethod;
    setProperties: AppEnvSetPropertiesMethod;
    setProperty: AppEnvSetPropertyMethod;
}

interface AppEnvGetPropertyMethod {
    (name: string, options?: AppEnvGetPropertyOptions): any;
}

interface AppEnvHasPropertyMethod {
    (name: string): boolean;
}

interface AppEnvSetPropertiesMethod {
    (properties: { [key: string]: any }): void;
}

interface AppEnvSetPropertyMethod {
    (name: string, value: any): void;
}

export interface AppEnvGetPropertyOptions {
    defaultValue?: any;
    failIfNotExist?: boolean;
}

interface InternalPrivateAPI {
    properties: {
        [key: string]: any;
    };
}

/**
 * Get a property from the environment
 * @param propertyName The property to fetch
 * @param options Options for how the property value is processed
 * @name getProperty
 * @memberof AppEnv
 */
function __getProperty(propertyName: string, options: AppEnvGetPropertyOptions = {}) {
    const self = this as InternalPrivateAPI;
    const { defaultValue = null, failIfNotExist = true } = options;
    if (typeof self.properties[propertyName] !== "undefined") {
        return self.properties[propertyName];
    }
    if (failIfNotExist) {
        throw new Error(
            `Unable to get application environment property: '${propertyName}' does not exist`
        );
    }
    return defaultValue;
}

/**
 * Detect if the environment has a property set
 * @param propertyName The property to check
 * @returns True if the property has been set
 * @name hasProperty
 * @memberof AppEnv
 */
function __hasProperty(propertyName: string): boolean {
    const self = this as InternalPrivateAPI;
    return typeof self.properties[propertyName] !== "undefined";
}

/**
 * Set several properties on the environment
 * @param propertyList The items to set
 * @name setProperties
 * @memberof AppEnv
 * @see setProperty
 */
function __setProperties(propertyList: { [key: string]: any }) {
    const self = this as InternalPrivateAPI;
    const setProp = __setProperty.bind(self);
    for (const propertyName in propertyList) {
        setProp(propertyName, propertyList[propertyName]);
    }
}

/**
 * Set a property on the environment
 * @param propertyName The property to set
 * @param propertyValue The value to set
 * @name setProperty
 * @memberof AppEnv
 */
function __setProperty(propertyName, propertyValue) {
    const self = this as InternalPrivateAPI;
    if (typeof self.properties[propertyName] !== "undefined") {
        throw new Error(
            `Unable to set application environment property: '${propertyName}' already exists`
        );
    }
    assignObjImmutableProp(self.properties, propertyName, propertyValue);
}

/**
 * Create a new application environment
 * @returns A new AppEnv instance
 */
export function createAppEnv(): AppEnv {
    const env = {};
    const privateEnv: InternalPrivateAPI = {
        properties: {}
    };
    assignObjImmutableProp(env, "getProperty", __getProperty.bind(privateEnv));
    assignObjImmutableProp(env, "hasProperty", __hasProperty.bind(privateEnv));
    assignObjImmutableProp(env, "setProperties", __setProperties.bind(privateEnv));
    assignObjImmutableProp(env, "setProperty", __setProperty.bind(privateEnv));
    return env as AppEnv;
}
