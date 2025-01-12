import { EntryFacade, EntryPropertyType, EntryPropertyValueType } from "@buttercup/core";
import React, { useMemo } from "react";
import { Card, Descriptions, Typography } from "antd";
import { DescriptionsItemType } from "antd/es/descriptions/index.js";
import { getUIEntryTypes } from "../../../../library/entryTypes.jsx";
import { PASSWORD_MASK } from "../util.js";
import { sortAndFilterProperties } from "../../../../library/entryProperties.js";

interface EntryDetailsCreditCardProps {
    entry: EntryFacade;
}

export function EntryDetailsCreditCard(props: EntryDetailsCreditCardProps) {
    const entryTypes = useMemo(getUIEntryTypes, []);
    const entryTypeName = useMemo(
        () =>
            entryTypes.find((type) => type.entryType === props.entry.type)
                ?.title ?? "Unknown",
        [entryTypes, props.entry]
    );

    const properties = useMemo<Array<DescriptionsItemType>>(
        () => sortAndFilterProperties(props.entry.fields)
            .map(field => ({
                key: field.property,
                label: field.title || field.property,
                children: field.valueType === EntryPropertyValueType.Password ? PASSWORD_MASK : field.value
            })),
        [props.entry]
    );

    return (
        <>
            <Descriptions
                title={entryTypeName}
                bordered
                column={2}
                size="small"
                items={properties}
            />
        </>
    );
}
