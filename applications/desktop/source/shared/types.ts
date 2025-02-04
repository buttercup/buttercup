import {
    SearchResult as CoreSearchResult,
    EntryFacade,
    VaultFormatID,
    VaultSourceID,
    VaultSourceStatus
} from "@buttercup/core";
import { VaultEditInterface } from "./vaultEdit/types.js";

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
    vaultEditSplitEntriesWidth: number;
    vaultEditSplitMenuWidth: number;
    windowHeight: number;
    windowWidth: number;
    windowX: null | number;
    windowY: null | number;
}

export interface DatasourceConfig {
    type: SourceType | null;
    [key: string]: string | null;
}

export interface IPCInterface {
    emit_frontend_log: (level: LogLevel, message: string) => void;
    enter_vault: (sourceID: VaultSourceID) => void;
    execute_vault_edit_action: <Method extends keyof VaultEditInterface>(
        sourceID: VaultSourceID,
        method: Method,
        args: Parameters<VaultEditInterface[Method]>
    ) => Promise<Awaited<ReturnType<VaultEditInterface[Method]>>>;
    get_config: () => Config;
    get_vaults_list: () => Array<VaultSourceDescription>;
    get_vault_window_state: () => VaultState;
    local_file_add_existing: (
        name: string,
        filePath: string,
        password: string
    ) => void;
    local_file_browse_existing: () => { filePath: string | null };
    lock_vault: (sourceID: VaultSourceID) => void;
    set_config_value: <Key extends keyof Config>(key: Key, value: Config[Key]) => Config;
    unlock_vault: (sourceID: VaultSourceID, password: string) => void;
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

export interface VaultState {
    source: "saving" | "idle";
}
