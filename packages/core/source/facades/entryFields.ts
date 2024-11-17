import { createFieldDescriptor } from "./tools.js";
import { Entry } from "../core/Entry.js";
import {
    EntryFacadeField,
    EntryPropertyType,
    EntryPropertyValueType,
    EntryType
} from "../types.js";

const DIGIT = "\\d";

function createBaseFields(entry: Entry): Array<EntryFacadeField> {
    return [createFieldDescriptor(entry, "Title", EntryPropertyType.Property, "title")];
}

function createCreditCardFields(entry: Entry): Array<EntryFacadeField> {
    return [
        ...createBaseFields(entry),
        createFieldDescriptor(entry, "Card Holder", EntryPropertyType.Property, "username"),
        createFieldDescriptor(entry, "Card Number", EntryPropertyType.Property, "password", {
            formatting: {
                format: [
                    { char: DIGIT, repeat: 4 },
                    { exactly: "-" },
                    { char: DIGIT, repeat: 4 },
                    { exactly: "-" },
                    { char: DIGIT, repeat: 4 },
                    { exactly: "-" },
                    { char: DIGIT, repeat: 4 }
                ],
                placeholder: "DDDD-DDDD-DDDD-DDDD"
            }
        }),
        createFieldDescriptor(entry, "Card Type", EntryPropertyType.Property, "type", {
            formatting: {
                options: {
                    visa: "Visa",
                    mastercard: "Mastercard",
                    amex: "American Express",
                    discover: "Discover",
                    generic: "Generic"
                },
                defaultOption: "generic"
            }
        }),
        createFieldDescriptor(entry, "CVV", EntryPropertyType.Property, "cvv", {
            formatting: {
                format: [{ char: DIGIT, repeat: 4 }],
                placeholder: "DDD or DDDD"
            },
            valueType: EntryPropertyValueType.Password
        }),
        createFieldDescriptor(entry, "Valid From", EntryPropertyType.Property, "valid_from", {
            formatting: {
                format: [
                    { char: "[01]", repeat: 1 },
                    { char: DIGIT, repeat: 1 },
                    { exactly: "/" },
                    { char: "2", repeat: 1 },
                    { char: DIGIT, repeat: 3 }
                ],
                placeholder: "MM/YYYY"
            }
        }),
        createFieldDescriptor(entry, "Expiry", EntryPropertyType.Property, "expiry", {
            formatting: {
                format: [
                    { char: "[01]", repeat: 1 },
                    { char: DIGIT, repeat: 1 },
                    { exactly: "/" },
                    { char: "2", repeat: 1 },
                    { char: DIGIT, repeat: 3 }
                ],
                placeholder: "MM/YYYY"
            }
        })
    ];
}

function createLoginFields(entry: Entry): Array<EntryFacadeField> {
    return [
        ...createBaseFields(entry),
        createFieldDescriptor(entry, "Username", EntryPropertyType.Property, "username"),
        createFieldDescriptor(entry, "Password", EntryPropertyType.Property, "password", {
            valueType: EntryPropertyValueType.Password
        })
    ];
}

function createNoteFields(entry: Entry): Array<EntryFacadeField> {
    return [
        ...createBaseFields(entry),
        createFieldDescriptor(entry, "Note", EntryPropertyType.Property, "note", {
            valueType: EntryPropertyValueType.Note
        })
    ];
}

function createSSHKeyFields(entry: Entry): Array<EntryFacadeField> {
    return [
        ...createBaseFields(entry),
        createFieldDescriptor(entry, "Public key", EntryPropertyType.Property, "publicKey"),
        createFieldDescriptor(entry, "Private key", EntryPropertyType.Property, "privateKey", {
            valueType: EntryPropertyValueType.Note
        })
    ];
}

function createWebsiteFields(entry: Entry): Array<EntryFacadeField> {
    return [
        ...createLoginFields(entry),
        createFieldDescriptor(entry, "URL", EntryPropertyType.Property, "url")
    ];
}

export default {
    [EntryType.CreditCard]: createCreditCardFields,
    [EntryType.Login]: createLoginFields,
    [EntryType.Note]: createNoteFields,
    [EntryType.SSHKey]: createSSHKeyFields,
    [EntryType.Website]: createWebsiteFields
};
