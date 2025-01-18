import {
    AppStartMode,
    Preferences,
    ThemeSource,
    VaultSettingsLocal
} from "./types.js";

export const COLOURS = {
    DARK_PRIMARY: "#292C33",
    DARK_SECONDARY: "#31353D",
    BRAND_PRIMARY: "#00B7AC",
    BRAND_PRIMARY_DARKER: "#179E94",
    GRAY_LIGHT: "#F5F7FA",
    GRAY_LIGHT_DARKER: "#E4E9F2",
    GRAY_DARK: "#777",
    GRAY: "#E4E9F2",
    RED: "#EB5767",
    RED_DARKER: "#E84054",
    BLACK_5: "rgba(0,0,0,.05)",
    BLACK_10: "rgba(0,0,0,.10)",
    BLACK_20: "rgba(0,0,0,.20)",
    BLACK_25: "rgba(0,0,0,.25)",
    BLACK_35: "rgba(0,0,0,.35)",
    WHITE_50: "rgba(255,255,255,.50)",
    LEVEL_4: "#5CAB7D",
    LEVEL_3: "#8FBC94",
    LEVEL_2: "#FFBC42",
    LEVEL_1: "#E71D36",
    LEVEL_0: "#E71D36"
};

export const APP_ID = "pw.buttercup.desktop";
export const ATTACHMENTS_MAX_SIZE = 20 * 1024 * 1024;
export const DEFAULT_LANGUAGE = "en";
export const DROPBOX_CLIENT_ID = "5fstmwjaisrt06t";
export const GOOGLE_AUTH_REDIRECT = "https://buttercup.pw?googledesktopauth";
export const GOOGLE_AUTH_TIMEOUT = 5 * 60 * 1000;
const GOOGLE_DRIVE_BASE_SCOPES = ["email", "profile"];
export const GOOGLE_DRIVE_SCOPES_STANDARD = [
    ...GOOGLE_DRIVE_BASE_SCOPES,
    "https://www.googleapis.com/auth/drive.file" // Per-file access
];
export const GOOGLE_CLIENT_ID =
    "327941947801-fumr4be9juk0bu3ekfuq9fr5bm7trh30.apps.googleusercontent.com";
export const GOOGLE_CLIENT_SECRET = "2zCBNDSXp1yIu5dyE5BVUWQZ";
export const ICON_UPLOAD = "upload";

export const PREFERENCES_DEFAULT: Preferences = {
    autoClearClipboard: false, // seconds
    fileHostEnabled: false,
    language: null,
    lockVaultsAfterTime: false, // seconds
    lockVaultsOnWindowClose: false,
    prereleaseUpdates: false,
    startMode: AppStartMode.None,
    startWithSession: false,
    uiTheme: ThemeSource.System
};

export const VAULT_EDIT_MIN_WIDTH_DETAILS = 410;
export const VAULT_EDIT_MIN_WIDTH_ENTRIES = 300;
export const VAULT_EDIT_MIN_WIDTH_MENU = 200;

export const VAULT_SETTINGS_DEFAULT: VaultSettingsLocal = {
    localBackup: false,
    localBackupLocation: null,
    biometricForcePasswordMaxInterval: "",
    biometricForcePasswordCount: "",
    biometricLastManualUnlock: +Infinity,
    biometricUnlockCount: 0
};
