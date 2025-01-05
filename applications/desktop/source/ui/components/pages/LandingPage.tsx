import {
    AppleOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    DropboxOutlined,
    EditOutlined,
    GoogleOutlined,
    LockOutlined,
    UnlockOutlined
} from "@ant-design/icons";
import { Badge, Card, Divider, Layout, List, Typography } from "antd";
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { styled } from "styled-components";
import { VaultSourceID, VaultSourceStatus } from "@buttercup/core";
import { useDeepCompareMemo } from "use-deep-compare";
import { VaultIcon } from "../icons/VaultIcon.jsx";
import { SourceType } from "../../../shared/types.js";
import { useRepeatingIPCCall } from "../../hooks/ipc.js";
import { useNotification } from "../../hooks/notifications.js";

const SourceCard = styled(Card)`
    .ant-card-body {
        padding: 16px;
    }
`;

const SourceItem = styled(List.Item)`
    .ant-ribbon-wrapper {
        width: 100%;
    }
`;

function getVaultTypes() {
    return [
        {
            name: "Local",
            type: SourceType.File,
            icon: <AppleOutlined style={{ fontSize: "48px" }} />,
            description: "Store passwords locally with strong encryption",
            enabled: true
        },
        {
            name: "Dropbox",
            type: SourceType.Dropbox,
            icon: <DropboxOutlined style={{ fontSize: "48px", opacity: 0.4 }} />,
            description: "Sync passwords securely across devices",
            enabled: false
        },
        {
            name: "Google Drive",
            type: SourceType.GoogleDrive,
            icon: <GoogleOutlined style={{ fontSize: "48px", opacity: 0.4 }} />,
            description: "Sync passwords securely across devices",
            enabled: false
        },
        {
            name: "WebDAV",
            type: SourceType.WebDAV,
            icon: <CloudUploadOutlined style={{ fontSize: "48px", opacity: 0.4 }} />,
            description: "Sync passwords securely across devices",
            enabled: false
        }
    ];
}

export function LandingPage() {
    const navigate = useNavigate();
    const notification = useNotification();
    const vaultTypes = useMemo(getVaultTypes, []);

    const { result: vaultsResult } = useRepeatingIPCCall("get_vaults_list", [], 5000);
    const vaults = useDeepCompareMemo(() => Array.isArray(vaultsResult) ? vaultsResult : [], [vaultsResult]);

    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const handleSourceClick = useCallback((id: VaultSourceID) => {
        const item = vaults.find(vault => vault.id === id);
        if (!item) {
            notification.error({
                message: "Invalid vault",
                description: `No vault was found for ID: ${id}`
            });
            return;
        }
        if (item.state === VaultSourceStatus.Pending) {
            notification.error({
                message: "Invalid vault state",
                description: "Vault in pending state"
            });
            return;
        }

        if (item.state === VaultSourceStatus.Locked) {
            navigate(`/unlock-vault/${id}`);
        } else {
            navigate(`/vault/${id}`);
        }
    }, [navigate, notification, vaults]);

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Layout.Content style={{ display: "flex" }}>
                <div style={{ flex: 1, padding: "10px 24px" }}>
                    <Typography.Title level={2} style={{ textAlign: "center" }}>
                        Vaults
                    </Typography.Title>
                    <List
                        style={{ width: "100%" }}
                        dataSource={vaults.map(vault => ({
                            id: vault.id,
                            title: vault.name,
                            icon: <VaultIcon size={64} vaultID={vault.id} />,
                            unlocked: vault.state === VaultSourceStatus.Unlocked
                        }))}
                        renderItem={(item) => (
                            <SourceItem>
                                <Badge.Ribbon
                                    color={item.unlocked ? "green" : "#bbb"}
                                    text={item.unlocked ? <UnlockOutlined /> : <LockOutlined />}
                                >
                                    <Card
                                        hoverable
                                        style={{ width: "100%" }}
                                        size="small"
                                        actions={
                                            hoveredItem === item.id
                                                ? [
                                                    <EditOutlined
                                                        key="edit"
                                                        className="card-actions"
                                                    />,
                                                    <DeleteOutlined
                                                        key="delete"
                                                        className="card-actions"
                                                    />
                                                ]
                                                : []
                                        }
                                        onClick={() => handleSourceClick(item.id)}
                                        onMouseEnter={() =>
                                            setHoveredItem(item.id)
                                        }
                                        onMouseLeave={() => setHoveredItem(null)}
                                    >
                                        <Card.Meta
                                            avatar={item.icon}
                                            title={item.title}
                                            description="WebDAV-enabled remote vault"
                                        />
                                    </Card>
                                </Badge.Ribbon>
                            </SourceItem>
                        )}
                    />
                </div>

                <Divider type="vertical" style={{ height: "auto" }} />

                <div style={{ flex: 1, padding: "10px 24px" }}>
                    <Typography.Title level={2} style={{ textAlign: "center" }}>
                        Connect New Vault
                    </Typography.Title>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "16px"
                        }}
                    >
                        {vaultTypes.map((type, index) => (
                            <SourceCard
                                key={index}
                                hoverable={type.enabled}
                                style={{ textAlign: "center" }}
                                onClick={() => {
                                    if (type.enabled) {
                                        navigate(`/add-vault/${type.type}`);
                                    }
                                }}
                            >
                                {type.icon}
                                <Typography.Title level={4} disabled={!type.enabled}>
                                    {type.name}
                                </Typography.Title>
                                <Typography.Text type="secondary" disabled={!type.enabled}>
                                    {type.description}
                                </Typography.Text>
                            </SourceCard>
                        ))}
                    </div>
                </div>
            </Layout.Content>
        </Layout>
    );
}
