import {
    SearchResult as CoreSearchResult,
    EntryFacade,
    VaultFormatID,
    VaultSourceID,
    VaultSourceStatus
} from "@buttercup/core";

export interface AddVaultPayload {
    createNew: boolean;
    datasourceConfig: DatasourceConfig;
    masterPassword: string;
    fileNameOverride?: string;
}

export interface AppEnvironmentFlags {
    portable: boolean;
}

export enum AppStartMode {
    HiddenOnBoot = "hiddenOnBoot",
    HiddenAlways = "hiddenAlways",
    None = "none"
}

export interface Config {
    browserClients: Record<
        string,
        {
            publicKey: string;
        }
    >;
    browserPrivateKey: string | null;
    browserPublicKey: string | null;
    fileHostKey: null | string;
    isMaximised: boolean;
    preferences: Preferences;
    selectedSource: null | string;
    windowHeight: number;
    windowWidth: number;
    windowX: null | number;
    windowY: null | number;
}

export interface DatasourceConfig {
    type: SourceType | null;
    [key: string]: string | null;
}

export interface Language {
    name: string;
    slug: string | null;
}

export enum LogLevel {
    Error = "error",
    Info = "info",
    Warning = "warning"
}

export interface Preferences {
    autoClearClipboard: false | number;
    fileHostEnabled: boolean;
    language: null | string;
    lockVaultsAfterTime: false | number;
    lockVaultsOnWindowClose: boolean;
    prereleaseUpdates: boolean;
    startMode: AppStartMode;
    startWithSession: boolean;
    uiTheme: ThemeSource;
}

export interface SearchResult {
    type: "entry";
    result: CoreSearchResult;
}

export enum SourceType {
    Dropbox = "dropbox",
    File = "file",
    GoogleDrive = "googledrive",
    WebDAV = "webdav"
}

export enum ThemeSource {
    System = "system",
    Dark = "dark",
    Light = "light"
}

export interface UpdatedEntryFacade extends EntryFacade {
    isNew?: boolean;
}

export interface UpdateProgressInfo {
    bytesPerSecond: number;
    percent: number;
    total: number;
    transferred: number;
}

export interface VaultSettingsLocal {
    biometricForcePasswordCount: string;
    biometricForcePasswordMaxInterval: string;
    biometricLastManualUnlock: number | null;
    biometricUnlockCount: number;
    localBackup: boolean;
    localBackupLocation: null | string;
}

export interface VaultSourceDescription {
    id: VaultSourceID;
    name: string;
    state: VaultSourceStatus;
    type: SourceType;
    order: number;
    format?: VaultFormatID;
}
