import EventEmitter from "eventemitter3";
import { forEachAsync } from "foreachasync";
import globals from "global";
import { TextDatasource } from "./TextDatasource.js";

function markGlobalPresence() {
    if (typeof globals._bcupAuthMgr !== "undefined") {
        console.warn(
            "Detected multiple Buttercup authentication managers for datasources: Multiple copies of the same library may have been bundled together"
        );
    }
    globals._bcupAuthMgr = true;
}

let __sharedManager: DatasourceAuthManager;

interface AuthHandlerFunction {
    (datasource: TextDatasource): void;
}

interface AuthHandlers {
    [type: string]: Array<AuthHandlerFunction>;
}

/**
 * Authentication manager
 * @augments EventEmitter
 * @memberof module:Buttercup
 */
export default class DatasourceAuthManager extends EventEmitter {
    /**
     * Get the shared DatasourceAuthManager instance
     * @returns The shared auth manager instance
     * @static
     * @memberof DatasourceAuthManager
     */
    static getSharedManager(): DatasourceAuthManager {
        if (!__sharedManager) {
            __sharedManager = new DatasourceAuthManager();
            markGlobalPresence();
        }
        return __sharedManager;
    }

    _handlers: AuthHandlers;

    /**
     * Constructor for the auth manager
     */
    constructor() {
        super();
        this._handlers = {};
    }

    /**
     * Execute auth handlers for a datasource
     * @param datasourceType The type of datasource (slug)
     * @param datasourceInst The datasource instance
     * @returns A promise that resolves once execution has completed
     * @throws {Error} Throws if no handlers have been specified
     * @memberof DatasourceAuthManager
     */
    executeAuthHandlers(datasourceType: string, datasourceInst: TextDatasource): Promise<void> {
        const handlers = this._handlers[datasourceType];
        if (!Array.isArray(handlers)) {
            return Promise.reject(
                new Error(
                    `Failed executing auth handlers: No handlers registered for datasource type: ${datasourceType}`
                )
            );
        }
        return Promise.resolve()
            .then(() => forEachAsync(handlers, (handler) => handler(datasourceInst)))
            .then(() => {
                /**
                 * Event for when the handlers have been fired
                 */
                this.emit("authHandlersExecuted", {
                    datasource: datasourceInst,
                    datasourceType
                });
            });
    }

    /**
     * Register an auth handler
     * @param datasourceType The datasource type
     * @param handler The handler function
     * @example
     *  authManager.registerHandler("googledrive", datasource => {
     *      return renewTokens().then(({ accessToken, refreshToken }) => {
     *          datasource.token = accessToken;
     *          datasource.refreshToken = refreshToken;
     *      });
     *  });
     * @memberof DatasourceAuthManager
     * @throws {Error} Throws if the handler argument is not a function
     */
    registerHandler(datasourceType: string, handler: AuthHandlerFunction) {
        if (typeof handler !== "function") {
            throw new Error("Failed registering handler: Argument was not a function");
        }
        this._handlers[datasourceType] = this._handlers[datasourceType] || [];
        this._handlers[datasourceType].push(handler);
    }
}
