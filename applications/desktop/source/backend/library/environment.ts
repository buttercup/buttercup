export interface Environment {
    buttercupConfigDir: string | null;
    buttercupHomeDir: string | null;
    buttercupTempDir: string | null;
    portableExecutableAppFilename: string | null;
    portableExecutableDirectory: string | null;
}

let __env: Environment | null;

export function getEnvironment(): Environment {
    if (!__env) {
        __env = {
            buttercupConfigDir: process.env.BUTTERCUP_CONFIG_DIR ?? null,
            buttercupHomeDir: process.env.BUTTERCUP_HOME_DIR ?? null,
            buttercupTempDir: process.env.BUTTERCUP_TEMP_DIR ?? null,
            portableExecutableAppFilename:
                process.env.PORTABLE_EXECUTABLE_APP_FILENAME ?? null,
            portableExecutableDirectory:
                process.env.PORTABLE_EXECUTABLE_DIR ?? null
        };
    }
    return __env;
}
