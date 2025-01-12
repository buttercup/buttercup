import { EntryFacade, EntryPropertyType, EntryType } from "@buttercup/core";
import {
    Col,
    Descriptions,
    Divider,
    Flex,
    Progress,
    Row,
    Statistic,
    Typography
} from "antd";
import React, { useMemo } from "react";
import { styled } from "styled-components";
import { EntryDetailsDefault } from "./details/EntryDetailsDefault.jsx";
import { EntryDetailsNote } from "./details/EntryDetailsNote.jsx";
import { EntryDetailsCreditCard } from "./details/EntryDetailsCreditCard.jsx";

interface VaultEntryProps {
    entry: EntryFacade;
}

const StatisticSmallSuffix = styled(Statistic)`
    .ant-statistic-content-suffix {
        font-size: 16px;
    }
`;

export function VaultEntry(props: VaultEntryProps) {
    const title = useMemo(
        () =>
            props.entry.fields.find(
                (field) =>
                    field.propertyType === EntryPropertyType.Property &&
                    field.property === "title"
            )?.value ?? "",
        [props.entry]
    );



    return (
        <>
            <Typography.Title level={2} style={{ marginTop: 0 }}>
                {title}
            </Typography.Title>
            {/* <Row gutter={16}>
                <Col span={6}>
                    <Statistic title="Logins" value={5} />
                </Col>
                <Col span={6}>
                    <Statistic title="Page Opened" value={8} />
                </Col>
                <Col span={6}>
                    <StatisticSmallSuffix
                        title="Password Updated"
                        suffix="days ago"
                        value={8}
                    />
                </Col>
                <Col span={6}>
                    <StatisticSmallSuffix
                        title="Created"
                        suffix="months ago"
                        value={5}
                    />
                </Col>
            </Row>
            <Divider /> */}
            {props.entry.type === EntryType.CreditCard && (<EntryDetailsCreditCard entry={props.entry} />)}
            {props.entry.type === EntryType.Login && (<EntryDetailsDefault entry={props.entry} />)}
            {props.entry.type === EntryType.Note && (<EntryDetailsNote entry={props.entry} />)}
            {props.entry.type === EntryType.SSHKey && (<EntryDetailsDefault entry={props.entry} />)}
            {props.entry.type === EntryType.Website && (<EntryDetailsDefault entry={props.entry} />)}
            {/* <Divider />
            <div>
                <Card style={{ width: "58px", padding: "0px" }}>
                    <FileZipOutlined/>
                </Card>
            </div> */}
        </>
    );
}
