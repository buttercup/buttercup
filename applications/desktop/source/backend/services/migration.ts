import { assertError, Layerr } from "layerr";
import { naiveClone } from "../../shared/library/clone.js";
import { AppStartMode, Config } from "../types.js";

export type ConfigMigration = [name: string, migration: (config: Config) => Config | null];

const MIGRATIONS: Array<ConfigMigration> = [
    [
        "startInBackground",
        (config: Config) => {
            if (
                config.preferences &&
                // @ts-ignore
                typeof config.preferences["startInBackground"] === "boolean"
            ) {
                const prefs = { ...config.preferences };
                // @ts-ignore
                prefs.startMode = config.preferences["startInBackground"]
                    ? AppStartMode.HiddenAlways
                    : AppStartMode.None;
                // @ts-ignore
                delete prefs["startInBackground"];
                return {
                    ...config,
                    preferences: prefs
                };
            }
            return null; //  No change
        }
    ]
];

export function runConfigMigrations(config: Config): [Config, changed: boolean] {
    let current = naiveClone(config),
        changed = false;
    for (const [name, execute] of MIGRATIONS) {
        try {
            const result = execute(current);
            if (result !== null) {
                changed = true;
                current = result;
            }
        } catch (err) {
            assertError(err);
            throw new Layerr(err, `Failed executing config migration: ${name}`);
        }
    }
    return [current, changed];
}
