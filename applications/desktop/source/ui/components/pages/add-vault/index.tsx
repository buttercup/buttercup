import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb, Layout, Steps, theme } from "antd";
import { styled } from "styled-components";
import { useParams } from "react-router";
import {
    CheckOutlined,
    FileProtectOutlined,
    UnlockOutlined
} from "@ant-design/icons";
import { SourceType } from "../../../../shared/types.js";
import { LocalFileRouter } from "./LocalFileRouter.jsx";
import { AddVaultStatus } from "./types.js";

type AddVaultPageParams = {
    type: SourceType;
};

const BreadcrumbItem = styled(Breadcrumb.Item)`
    user-select: none;
`;

// function getStepsForVaultType(
//     sourceType: SourceType,
//     status: AddVaultStatus
// ): Array<AddStepProps> {
//     switch (sourceType) {
//         case SourceType.File: {
//             let statuses: [AddStepProps["status"], AddStepProps["status"], AddStepProps["status"]] = ["wait", "wait", "wait"];
//             switch (status) {
//                 case AddVaultStatus.ChoosingFile:
//                     statuses = ["process", "wait", "wait"];
//                     break;
//                 case AddVaultStatus.UnlockVault:
//                     statuses = [""]
//             }
//             return [
//                 {
//                     id: "choose-file",
//                     title: "Choose File",
//                     status: statuses[0],
//                     icon: <FileProtectOutlined />
//                 },
//                 {
//                     id: "unlock",
//                     title: "Unlock",
//                     status: statuses[1],
//                     icon: <UnlockOutlined />
//                 },
//                 {
//                     id: "done",
//                     title: "Done",
//                     status: statuses[2],
//                     icon: <CheckOutlined />
//                 }
//             ];
//         }
//         default:
//             return [];
//     }
// }

function getDefaultStatusForVaultType(sourceType: SourceType): AddVaultStatus {
    switch (sourceType) {
        case SourceType.File:
            return AddVaultStatus.ChooseFile;

        default:
            throw new Error("Not implemented");
    }
}

export function AddVaultPage() {
    const { type } = useParams<AddVaultPageParams>();
    if (!type) {
        throw new Error(`Invalud type: ${type}`);
    }

    // const [progressState, setProgressState] = useState<Array<AddStepProps>>([]);
    // const [currentStatus, setCurrentStatus] = useState<AddVaultStatus>(() => getDefaultStatusForVaultType(type));
    // useEffect(() => {
    //     const newState = getStepsForVaultType(type, currentStatus);
    //     setProgressState((currentState: AddStepProps[]) =>
    //         newState.map((item: AddStepProps) => {
    //             const existing = currentState.find(
    //                 (current) => current.id === item.id
    //             );
    //             return {
    //                 ...item,
    //                 status: existing ? existing.status : item.status
    //             };
    //         })
    //     );
    // }, [currentStatus, type]);

    // const currentPage = useMemo(() => {
    //     const errored = progressState.find((item) => item.status === "error");
    //     if (errored) return errored.id;

    //     const nextWaiting = progressState.find(
    //         (item) => item.status === "wait"
    //     );
    //     if (nextWaiting) return nextWaiting.id;

    //     const finished = [...progressState]
    //         .reverse()
    //         .find((item) => item.status === "finish");
    //     if (finished) return finished.id;

    //     return progressState[0]?.id;
    // }, [progressState]);

    const {
        token: { colorBgContainer, borderRadiusLG }
    } = theme.useToken();
    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Layout.Content
                style={{
                    padding: "0 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                }}
            >
                <Breadcrumb
                    style={{
                        margin: "16px 0",
                        flex: "0 0 auto"
                    }}
                >
                    <BreadcrumbItem href="#/">Home</BreadcrumbItem>
                    <BreadcrumbItem>Add Vault</BreadcrumbItem>
                </Breadcrumb>
                <div
                    style={{
                        padding: 24,
                        marginBottom: 24,
                        flex: "1 1 auto",
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                    }}
                >
                    {type === SourceType.File && (
                        <LocalFileRouter />
                    )}
                </div>
            </Layout.Content>
        </Layout>
    );
}
