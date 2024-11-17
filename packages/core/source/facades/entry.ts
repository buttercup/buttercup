import facadeFieldFactories from "./entryFields.js";
import {
    createFieldDescriptor,
    getEntryPropertyValueType,
    setEntryPropertyValueType
} from "./tools.js";
import { Entry } from "../core/Entry.js";
import { Group } from "../core/Group.js";
import {
    EntryFacade,
    EntryFacadeField,
    EntryID,
    EntryPropertyType,
    EntryType,
    EntryPropertyValueType,
    GroupID,
    VaultFacade
} from "../types.js";

export interface CreateEntryFacadeOptions {
    type?: EntryType;
}

const { FacadeType: FacadeTypeAttribute } = Entry.Attributes;

/**
 * Add extra fields to a fields array that are not mentioned in a preset
 * Facades are creaded by presets which don't mention all property values (custom user
 * added items). This method adds the unmentioned items to the facade fields so that
 * they can be edited as well.
 * @param entry An Entry instance
 * @param fields An array of fields
 * @returns A new array with all combined fields
 * @private
 */
function addExtraFieldsNonDestructive(entry: Entry, fields: Array<EntryFacadeField>) {
    const exists = (propName: string, fieldType: EntryPropertyType) =>
        fields.find((item) => item.propertyType === fieldType && item.property === propName);
    const properties = entry.getProperty();
    const attributes = entry.getAttribute();
    return [
        ...fields,
        ...Object.keys(properties)
            .filter((name) => !exists(name, EntryPropertyType.Property))
            .map((name) =>
                createFieldDescriptor(
                    entry, // Entry instance
                    "", // Title
                    EntryPropertyType.Property, // Type
                    name, // Property name
                    { removeable: true }
                )
            ),
        ...Object.keys(attributes)
            .filter((name) => !exists(name, EntryPropertyType.Attribute))
            .map((name) =>
                createFieldDescriptor(
                    entry, // Entry instance
                    "", // Title
                    EntryPropertyType.Attribute, // Type
                    name // Property name
                )
            )
    ];
}

/**
 * Apply a facade field descriptor to an entry
 * Takes data from the descriptor and writes it to the entry.
 * @param entry The entry to apply to
 * @param descriptor The descriptor object
 * @private
 */
function applyFieldDescriptor(entry: Entry, descriptor: EntryFacadeField) {
    setEntryValue(
        entry,
        descriptor.propertyType,
        descriptor.property,
        descriptor.value,
        descriptor.valueType
    );
}

/**
 * Process a modified entry facade
 * @param entry The entry to apply processed data on
 * @param facade The facade object
 * @memberof module:Buttercup
 */
export function consumeEntryFacade(entry: Entry, facade: EntryFacade) {
    const facadeType = getEntryFacadeType(entry);
    if (facade && facade.type) {
        const properties = entry.getProperty();
        const attributes = entry.getAttribute();
        if (facade.type !== facadeType) {
            throw new Error(
                `Failed consuming entry data: Expected type "${facadeType}" but received "${facade.type}"`
            );
        }
        // update data
        (facade.fields || []).forEach((field) => applyFieldDescriptor(entry, field));
        // remove missing properties
        Object.keys(properties).forEach((propKey) => {
            const correspondingField = facade.fields.find(
                ({ propertyType, property }) => propertyType === "property" && property === propKey
            );
            if (typeof correspondingField === "undefined") {
                entry.deleteProperty(propKey);
            }
        });
        // remove missing attributes
        Object.keys(attributes).forEach((attrKey) => {
            const correspondingField = facade.fields.find(
                ({ propertyType, property }) => propertyType === "attribute" && property === attrKey
            );
            if (typeof correspondingField === "undefined") {
                entry.deleteAttribute(attrKey);
            }
        });
        return;
    }
    throw new Error("Failed consuming entry data: Invalid item passed as a facade");
}

/**
 * Create a data/input facade for an Entry instance
 * @param entry The Entry instance
 * @param options Options for the entry facade creation
 * @returns A newly created facade
 * @memberof module:Buttercup
 */
export function createEntryFacade(
    entry?: Entry,
    options: CreateEntryFacadeOptions = {}
): EntryFacade {
    if (entry && entry instanceof Entry !== true) {
        throw new Error("Failed creating entry facade: Provided item is not an Entry");
    }
    const { type } = options;
    const facadeType = type || getEntryFacadeType(entry);
    const createFields = facadeFieldFactories[facadeType];
    if (!createFields) {
        throw new Error(`Failed creating entry facade: No factory found for type "${facadeType}"`);
    }
    const fields = entry
        ? addExtraFieldsNonDestructive(entry, createFields(entry))
        : createFields(entry);
    if (
        !fields.find(
            (field) =>
                field.propertyType === EntryPropertyType.Attribute &&
                field.property === FacadeTypeAttribute
        )
    ) {
        const entryTypeField = createFieldDescriptor(
            entry, // Entry instance
            "", // Title
            EntryPropertyType.Attribute, // Type
            FacadeTypeAttribute // Property name
        );
        entryTypeField.value = facadeType;
        fields.push(entryTypeField);
    }
    return {
        id: entry ? entry.id : null,
        type: facadeType,
        fields,
        parentID: entry ? entry.getGroup().id : null,
        _history: [], // deprecated
        _changes: entry ? entry.getChanges() : []
    };
}

/**
 * Create a new entry using an entry facade
 * @param group The parent group
 * @param facade The entry facade
 * @returns A newly created Entry
 * @memberof module:Buttercup
 */
export function createEntryFromFacade(group: Group, facade: EntryFacade): Entry {
    const entry = group.createEntry();
    const baseFacadeType = getEntryFacadeType(entry);
    const facadeType = facade.type || baseFacadeType;
    const preparedFacade: EntryFacade = {
        ...facade,
        parentID: group.id,
        // Keep type same as new entry, for now..
        type: baseFacadeType,
        id: null
    };
    consumeEntryFacade(entry, preparedFacade);
    if (facadeType !== baseFacadeType) {
        // Set intended facade type
        entry.setAttribute(Entry.Attributes.FacadeType, facadeType);
    }
    return entry;
}

/**
 * Convert an array of entry facade fields to a
 * key-value object with only attributes
 * @param facadeFields Array of fields
 * @memberof module:Buttercup
 */
export function fieldsToAttributes(facadeFields: Array<EntryFacadeField>): {
    [key: string]: string;
} {
    return facadeFields.reduce((output, field) => {
        if (field.propertyType !== EntryPropertyType.Attribute) return output;
        output[field.property] = field.value;
        return output;
    }, {});
}

/**
 * Convert an array of entry facade fields to a
 * key-value object with only properties
 * @param facadeFields Array of fields
 * @memberof module:Buttercup
 */
export function fieldsToProperties(facadeFields: Array<EntryFacadeField>): {
    [key: string]: string;
} {
    return facadeFields.reduce((output, field) => {
        if (field.propertyType !== EntryPropertyType.Property) return output;
        output[field.property] = field.value;
        return output;
    }, {});
}

export function getEntryFacadePath(entryID: EntryID, facade: VaultFacade): Array<GroupID> {
    const entry = facade.entries.find((entry) => entry.id === entryID);
    if (!entry) {
        throw new Error(`No entry facade found for ID: ${entryID}`);
    }
    let targetGroupID: GroupID = null;
    const path: Array<GroupID> = [];
    do {
        targetGroupID = targetGroupID
            ? facade.groups.find((g) => g.id === targetGroupID).parentID
            : entry.parentID;
        if (targetGroupID && targetGroupID != "0") {
            path.unshift(targetGroupID);
        }
    } while (targetGroupID && targetGroupID != "0");
    return path;
}

/**
 * Get the facade type for an entry
 * @param entry The entry instance
 * @returns The facade type
 * @private
 */
function getEntryFacadeType(entry?: Entry): EntryType {
    if (!entry) {
        return EntryType.Login;
    }
    return entry.getType();
}

/**
 * Set the value type of an entry property within a facade
 * @param facade The entry facade to modify
 * @param propertyName The property to apply a new value type to
 * @param valueType The new value type
 */
export function setEntryFacadePropertyValueType(
    facade: EntryFacade,
    propertyName: string,
    valueType: EntryPropertyValueType
) {
    const matchingPropertyField = facade.fields.find(
        (field) =>
            field.property === propertyName && field.propertyType === EntryPropertyType.Property
    );
    const matchingAttributeField = facade.fields.find(
        (field) =>
            field.property === `${Entry.Attributes.FieldTypePrefix}${propertyName}` &&
            field.propertyType === EntryPropertyType.Attribute
    );
    if (matchingPropertyField) {
        matchingPropertyField.valueType = valueType;
    }
    if (matchingAttributeField) {
        matchingAttributeField.value = valueType;
    }
}

/**
 * Set a value on an entry
 * @param entry The entry instance
 * @param propertyType Type of property ("property"/"attribute")
 * @param property The property name
 * @param value The value to set
 * @param valueType Value type to set
 * @throws {Error} Throws if the property type is not recognised
 * @private
 */
function setEntryValue(
    entry: Entry,
    propertyType: EntryPropertyType,
    property: string,
    value: string,
    valueType?: EntryPropertyValueType
) {
    switch (propertyType) {
        case "property":
            if (entry.getProperty(property) !== value) {
                // Only update if changed
                entry.setProperty(property, value);
            }
            break;
        case "attribute":
            if (entry.getAttribute(property) !== value) {
                // Only update if changed
                entry.setAttribute(property, value);
            }
            break;
        default:
            throw new Error(`Cannot set value: Unknown property type: ${propertyType}`);
    }
    if (valueType && getEntryPropertyValueType(entry, property) !== valueType) {
        setEntryPropertyValueType(entry, property, valueType);
    }
}
