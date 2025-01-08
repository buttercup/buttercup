import React, { ReactNode } from "react";
import { EntryType as CoreEntryType } from "@buttercup/core";
import { CreditCardOutlined, EditOutlined, GlobalOutlined, KeyOutlined, LoginOutlined } from "@ant-design/icons";

export interface UIEntryType {
    entryType: CoreEntryType;
    icon: ReactNode;
    title: string;
}

export function getUIEntryTypes(): Array<UIEntryType> {
    return [
        {
            entryType: CoreEntryType.Login,
            icon: <LoginOutlined />,
            title: "Login"
        },
        {
            entryType: CoreEntryType.Website,
            icon: <GlobalOutlined />,
            title: "Website"
        },
        {
            entryType: CoreEntryType.Note,
            icon: <EditOutlined />,
            title: "Note"
        },
        {
            entryType: CoreEntryType.CreditCard,
            icon: <CreditCardOutlined />,
            title: "Credit Card"
        },
        {
            entryType: CoreEntryType.SSHKey,
            icon: <KeyOutlined />,
            title: "SSH Key Pair"
        }
    ];
}
