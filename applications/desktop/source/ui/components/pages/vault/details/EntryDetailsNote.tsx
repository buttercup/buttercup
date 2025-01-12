import { EntryFacade, EntryPropertyType, EntryPropertyValueType } from "@buttercup/core";
import React, { useMemo } from "react";
import { Card, Descriptions, Typography } from "antd";
import { DescriptionsItemType } from "antd/es/descriptions/index.js";
import { getUIEntryTypes } from "../../../../library/entryTypes.jsx";
import { PASSWORD_MASK } from "../util.js";
import { sortAndFilterProperties } from "../../../../library/entryProperties.js";

interface EntryDetailsNoteProps {
    entry: EntryFacade;
}

export function EntryDetailsNote(props: EntryDetailsNoteProps) {
    const entryTypes = useMemo(getUIEntryTypes, []);
    const entryTypeName = useMemo(
        () =>
            entryTypes.find((type) => type.entryType === props.entry.type)
                ?.title ?? "Unknown",
        [entryTypes, props.entry]
    );

    const noteField = useMemo(() => props.entry.fields.find(field => field.propertyType === EntryPropertyType.Property && field.property === "note") ?? null, []);

    const properties = useMemo<Array<DescriptionsItemType>>(
        () => sortAndFilterProperties(props.entry.fields)
            .filter(field => field.property !== "note")
            .map(field => ({
                key: field.property,
                label: field.title || field.property,
                children: field.valueType === EntryPropertyValueType.Password ? PASSWORD_MASK : field.value
            })),
        [props.entry]
    );

    return (
        <>
            <Typography.Title level={5}>{entryTypeName}</Typography.Title>
            {noteField && (
                <Card>
                    <Typography>{noteField.value}</Typography>
                </Card>
            )}
            <Descriptions
                bordered
                column={2}
                size="small"
                items={properties}
            />
        </>
    );
}
