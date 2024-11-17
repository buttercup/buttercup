import { EntryPropertyValueType, EntryType } from "../types.js";

export type EntryPropertyTypeIndex = {
    [key in EntryPropertyValueType]: {
        title: string;
        slug: EntryPropertyValueType;
    };
};

export type EntryTypeIndex = {
    [key in EntryType]: {
        title: string;
        slug: EntryType;
    };
};

/**
 * Default entry type
 * @memberof module:Buttercup
 */
export const DEFAULT_ENTRY_TYPE = EntryType.Login;
/**
 * Default entry field type
 * @memberof module:Buttercup
 */
export const DEFAULT_FIELD_TYPE = EntryPropertyValueType.Text;

/**
 * Entry types collection (all available)
 * @memberof module:Buttercup
 */
export const ENTRY_TYPES: EntryTypeIndex = {
    [EntryType.CreditCard]: {
        title: "Credit Card",
        slug: EntryType.CreditCard
    },
    [EntryType.Login]: {
        title: "Login",
        slug: EntryType.Login
    },
    [EntryType.Note]: {
        title: "Note",
        slug: EntryType.Note
    },
    [EntryType.SSHKey]: {
        title: "SSH Key Pair",
        slug: EntryType.SSHKey
    },
    [EntryType.Website]: {
        title: "Website Login",
        slug: EntryType.Website
    }
};

export const FACADE_VERSION = 2;

/**
 * Entry field value types collection (all available)
 * @memberof module:Buttercup
 */
export const FIELD_VALUE_TYPES: EntryPropertyTypeIndex = {
    [EntryPropertyValueType.Note]: {
        title: "Note",
        slug: EntryPropertyValueType.Note
    },
    [EntryPropertyValueType.OTP]: {
        title: "OTP (One Time Password)",
        slug: EntryPropertyValueType.OTP
    },
    [EntryPropertyValueType.Password]: {
        title: "Password (secret)",
        slug: EntryPropertyValueType.Password
    },
    [EntryPropertyValueType.Text]: {
        title: "Text (default)",
        slug: EntryPropertyValueType.Text
    }
};
