import React, { useMemo } from "react";
import { EntryFacade, EntryPropertyValueType } from "@buttercup/core";
import { Descriptions } from "antd";
import { DescriptionsItemType } from "antd/es/descriptions/index.js";
import { sortAndFilterProperties } from "../../../../library/entryProperties.js";
import { getUIEntryTypes } from "../../../../library/entryTypes.jsx";
import { PASSWORD_MASK } from "../util.jsx";

interface EntryDetailsDefaultProps {
    entry: EntryFacade;
}

export function EntryDetailsDefault(props: EntryDetailsDefaultProps) {
    const entryTypes = useMemo(getUIEntryTypes, []);
    const entryTypeName = useMemo(
        () =>
            entryTypes.find((type) => type.entryType === props.entry.type)
                ?.title ?? "Unknown",
        [entryTypes, props.entry]
    );

    const properties = useMemo<Array<DescriptionsItemType>>(
        () => sortAndFilterProperties(props.entry.fields).map(field => ({
            key: field.property,
            label: field.title || field.property,
            children: field.valueType === EntryPropertyValueType.Password ? PASSWORD_MASK : field.value
        })),
        [props.entry]
    );

    return (
        <Descriptions
            title={entryTypeName}
            bordered
            column={2}
            size="small"
            items={properties}
        />
    )
}
