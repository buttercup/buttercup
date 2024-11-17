import { AppEnv, createAppEnv } from "./appEnv.js";
import { assignObjImmutableProp } from "./prop.js";
import { getGlobal } from "./global.js";

const GLOBAL_INSTANCE_REF = "@@__ButtercupAppEnv";

/**
 * Get the shared app-environment configurator
 * (provides a controller for handling the substitution of
 * functions that need to work differently on different
 * environments)
 * @memberof module:Buttercup
 */
export function getSharedAppEnv(): AppEnv {
    const globalRef = getGlobal();
    if (!globalRef[GLOBAL_INSTANCE_REF]) {
        const appEnv = createAppEnv();
        assignObjImmutableProp(globalRef, GLOBAL_INSTANCE_REF, appEnv);
    }
    return globalRef[GLOBAL_INSTANCE_REF];
}
