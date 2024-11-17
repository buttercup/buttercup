import { Entry } from "../core/Entry.js";
import { generateUUID } from "../tools/uuid.js";
import {
    EntryFacadeField,
    EntryFacadeFieldFormatting,
    EntryPropertyType,
    EntryPropertyValueType
} from "../types.js";

export interface CreateFieldDescriptorOptions {
    formatting?: boolean | EntryFacadeFieldFormatting;
    removeable?: boolean;
    valueType?: EntryPropertyValueType;
}

const VALID_VALUE_TYPES = [
    EntryPropertyValueType.Note,
    EntryPropertyValueType.OTP,
    EntryPropertyValueType.Password,
    EntryPropertyValueType.Text
];

/**
 * Create a descriptor for a field to be used within a facade
 * @param entry The entry instance to process or null if the initial value
 *  should be empty
 * @param title The field title
 * @param entryPropertyType The type of entry property (property/attribute)
 * @param entryPropertyName The name of the property
 * @param options The options for the field
 * @returns The field descriptor
 * @memberof module:Buttercup
 */
export function createFieldDescriptor(
    entry: Entry | null,
    title: string,
    entryPropertyType: EntryPropertyType,
    entryPropertyName: string,
    options: CreateFieldDescriptorOptions = {}
): EntryFacadeField {
    const { formatting = false, removeable = false, valueType = null } = options;
    const value = entry ? getEntryValue(entry, entryPropertyType, entryPropertyName) : "";
    // Return descriptor
    return {
        id: generateUUID(),
        title,
        propertyType: entryPropertyType,
        property: entryPropertyName,
        value,
        valueType: valueType
            ? valueType
            : entryPropertyType === "attribute"
              ? null
              : getEntryPropertyValueType(entry, entryPropertyName),
        formatting,
        removeable
    };
}

/**
 * Get a value on an entry for a specific property type
 * @param entry The entry instance
 * @param propertyType The type of entry property (property/attribute)
 * @param name The property name
 * @returns The property value
 * @throws {Error} Throws for unknown property types
 * @deprecated Not in use - To be removed
 */
export function getEntryValue(
    entry: Entry,
    propertyType: EntryPropertyType,
    name: string
): string | undefined {
    switch (propertyType) {
        case EntryPropertyType.Property:
            return entry.getProperty(name) as string | undefined;
        case EntryPropertyType.Attribute:
            return entry.getAttribute(name) as string | undefined;
        default:
            throw new Error(`Cannot retrieve value: Unknown property type: ${propertyType}`);
    }
}

/**
 * Get the entry value type
 * @param entry Entry instance
 * @param propertyName The entry property name
 * @returns The entry value type (returns default "text"
 *  if entry not specified)
 */
export function getEntryPropertyValueType(
    entry: Entry | null,
    propertyName: string
): EntryPropertyValueType {
    if (!entry) {
        return EntryPropertyValueType.Text;
    }
    const type = entry.getAttribute(
        `${Entry.Attributes.FieldTypePrefix}${propertyName}`
    ) as EntryPropertyValueType;
    return VALID_VALUE_TYPES.indexOf(type) >= 0 ? type : EntryPropertyValueType.Text;
}

/**
 * Check if an ID signifies a new instance and not an
 *  existing one
 * @param id The ID to check
 */
export function idSignifiesNew(id: string, mergeMode: boolean = false): boolean {
    if (/^\d+$/.test(id) === false) return mergeMode;
    const numerical = parseInt(id, 10);
    return !isNaN(numerical) && numerical > 0 && numerical <= 999999;
}

/**
 * Set the value type attribute of an entry
 * @param entry Entry instance
 * @param propertyName The property name
 * @param valueType The value type
 */
export function setEntryPropertyValueType(
    entry: Entry,
    propertyName: string,
    valueType: EntryPropertyValueType
) {
    entry.setAttribute(`${Entry.Attributes.FieldTypePrefix}${propertyName}`, valueType);
}
