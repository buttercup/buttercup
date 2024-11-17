export { getSharedAppEnv } from "./core/singleton.js";

export type AppEnvMapper = <T extends { [key: string]: any }>(template: T) => T;
