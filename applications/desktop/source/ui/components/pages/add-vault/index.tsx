import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb, Layout, StepProps, Steps, theme } from "antd";
import { styled } from "styled-components";
import { useParams } from "react-router";
import { CheckOutlined, FileProtectOutlined, UnlockOutlined } from "@ant-design/icons";
import { SourceType } from "../../../../shared/types.js";
import { LocalFileRouter } from "./LocalFileRouter.jsx";

type AddVaultPageParams = {
    type: SourceType;
}

interface AddStepProps extends StepProps {
    icon: Required<StepProps>['icon'];
    id: string;
    status: Required<StepProps>['status'];
    title: Required<StepProps>['title'];
}

const BreadcrumbItem = styled(Breadcrumb.Item)`
    user-select: none;
`;

function getStepsForVaultType(sourceType: SourceType): Array<AddStepProps> {
    switch (sourceType) {
        case SourceType.File:
            return [
                {
                    id: "choose-file",
                    title: 'Choose File',
                    status: 'wait',
                    icon: <FileProtectOutlined />
                },
                {
                    id: "unlock",
                    title: 'Unlock',
                    status: 'wait',
                    icon: <UnlockOutlined />
                },
                {
                    id: "done",
                    title: 'Done',
                    status: 'wait',
                    icon: <CheckOutlined />
                },
            ];
        default:
            return [];
    }
}

export function AddVaultPage() {
    const { type } = useParams<AddVaultPageParams>();

    const [progressState, setProgressState] = useState<Array<AddStepProps>>([]);
    useEffect(() => {
        if (!type) return;
        const newState = getStepsForVaultType(type);
        setProgressState((currentState: AddStepProps[]) => newState.map((item: AddStepProps) => {
            const existing = currentState.find(current => current.id === item.id);
            return {
                ...item,
                status: existing ? existing.status : item.status
            };
        }));
    }, [type]);
    const currentPage = useMemo(() => {
        const errored = progressState.find(item => item.status === "error");
        if (errored) return errored.id;

        const nextWaiting = progressState.find(item => item.status === "wait");
        if (nextWaiting) return nextWaiting.id;

        const finished = [...progressState].reverse().find(item => item.status === "finish");
        if (finished) return finished.id;

        return progressState[0]?.id;
    }, [progressState]);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout.Content style={{ padding: "0 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Breadcrumb
                    style={{
                        margin: '16px 0',
                        flex: "0 0 auto"
                    }}
                >
                    <BreadcrumbItem href="#/">Home</BreadcrumbItem>
                    <BreadcrumbItem >Add Vault</BreadcrumbItem>
                </Breadcrumb>
                <div
                    style={{
                        padding: 24,
                        marginBottom: 24,
                        // minHeight: 380,
                        flex: "1 1 auto",
                        // height: "100%",
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <Steps
                        items={progressState}
                    />
                    {type === SourceType.File && <LocalFileRouter page={currentPage} />}
                </div>
            </Layout.Content>
        </Layout>
    );
}
