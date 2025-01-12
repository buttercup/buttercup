import { EntryFacadeField, EntryPropertyType } from "@buttercup/core"

export function sortAndFilterProperties(fields: Array<EntryFacadeField>): Array<EntryFacadeField> {
    return fields
        .filter(
            field => field.property !== "title" && field.propertyType === EntryPropertyType.Property
        );
}
