import { getSharedAppEnv } from "./env/core/singleton.js";
import { AppEnvMapper } from "./env/appEnv.js";
import { applyWebConfiguration } from "./env/web/index.js";
import * as localFileClient from "./web/localFileClient.js";

let __hasInitialised = false;

/**
 * Initialise the web environment
 * @memberof module:Buttercup
 */
export function init(appEnvMapper: AppEnvMapper = (x) => x) {
    if (__hasInitialised) return;
    __hasInitialised = true;
    const appEnv = getSharedAppEnv();
    applyWebConfiguration(appEnv, appEnvMapper);
}

export { default as LocalFileDatasource } from "./web/LocalFileDatasource.js";
export { default as LocalStorageInterface } from "./web/LocalStorageInterface.js";
export { default as LocalStorageDatasource } from "./web/LocalStorageDatasource.js";
export { localFileClient };

export * from "./index.common.js";
