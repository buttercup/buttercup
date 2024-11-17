export {
    InterruptedAutoUpdateFunction,
    VaultManager,
    VaultManagerAddSourceOptions,
    VaultManagerOptions
} from "./core/VaultManager.js";
export {
    VaultSource,
    VaultSourceConfig,
    VaultSourceMetadata,
    VaultSourceUnlockOptions
} from "./core/VaultSource.js";
export { Vault } from "./core/Vault.js";
export { Group } from "./core/Group.js";
export { Entry } from "./core/Entry.js";
export { AttachmentManager } from "./attachments/AttachmentManager.js";

export { detectFormat, getDefaultFormat, setDefaultFormat } from "./io/formatRouter.js";
export { VaultFormatA } from "./io/VaultFormatA.js";
export {
    getSignature as getFormatASignature,
    hasValidSignature as hasValidFormatASignature
} from "./io/formatA/signing.js";
export { VaultFormatB } from "./io/VaultFormatB.js";
export {
    getSignature as getFormatBSignature,
    hasValidSignature as hasValidFormatBSignature
} from "./io/formatB/signing.js";

export { TextDatasource } from "./datasources/TextDatasource.js";
export { MemoryDatasource } from "./datasources/MemoryDatasource.js";
export { FileDatasource } from "./datasources/FileDatasource.js";
export { default as WebDAVDatasource } from "./datasources/WebDAVDatasource.js";
export { default as DropboxDatasource } from "./datasources/DropboxDatasource.js";
export { default as GoogleDriveDatasource } from "./datasources/GoogleDriveDatasource.js";
export { default as DatasourceAuthManager } from "./datasources/DatasourceAuthManager.js";
export { registerDatasource } from "./datasources/register.js";

export {
    ConsumeVaultFacadeOptions,
    CreateVaultFacadeOptions,
    GetGroupEntriesFacadesOptions,
    GetGroupsFacadesOptions,
    consumeGroupFacade,
    consumeVaultFacade,
    createGroupFacade,
    createVaultFacade
} from "./facades/vault.js";
export { isOTPURI, isVaultFacade } from "./facades/detection.js";
export {
    CreateEntryFacadeOptions,
    consumeEntryFacade,
    createEntryFacade,
    createEntryFromFacade,
    fieldsToProperties,
    getEntryFacadePath,
    setEntryFacadePropertyValueType
} from "./facades/entry.js";
export {
    CreateFieldDescriptorOptions,
    createFieldDescriptor,
    getEntryPropertyValueType,
    setEntryPropertyValueType
} from "./facades/tools.js";
export {
    DEFAULT_ENTRY_TYPE,
    DEFAULT_FIELD_TYPE,
    ENTRY_TYPES,
    FIELD_VALUE_TYPES,
    EntryPropertyTypeIndex,
    EntryTypeIndex
} from "./facades/symbols.js";

export { Credentials } from "./credentials/Credentials.js";

export { StorageInterface } from "./storage/StorageInterface.js";
export { MemoryStorageInterface } from "./storage/MemoryStorageInterface.js";

export { SearchResult } from "./search/BaseSearch.js";
export { VaultEntrySearch as Search } from "./search/VaultEntrySearch.js"; // compat @todo remove
export { VaultEntrySearch } from "./search/VaultEntrySearch.js";
export { VaultFacadeEntrySearch } from "./search/VaultFacadeEntrySearch.js";
export { VaultSourceEntrySearch } from "./search/VaultSourceEntrySearch.js";
export { SearchKey, buildSearcher } from "./search/searcher.js";

export { AppEnv, AppEnvGetPropertyOptions } from "./env/core/appEnv.js";
export { getSharedAppEnv } from "./env/appEnv.js";

export { generateUUID } from "./tools/uuid.js";
export { EntryURLType, getEntryPath, getEntryURLs } from "./tools/entry.js";
export {
    base64ToBytes,
    bytesToBase64,
    decodeBase64String,
    encodeBase64String
} from "./tools/encoding.js";

export * from "./types.js";

/**
 * @module Buttercup
 */
