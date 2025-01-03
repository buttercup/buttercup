import {
    AppleOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    DropboxOutlined,
    EditOutlined,
    GoogleOutlined
} from "@ant-design/icons";
import { Card, Divider, Layout, List, Typography } from "antd";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { styled } from "styled-components";
import { VaultIcon } from "../icons/VaultIcon.jsx";
import { SourceType } from "../../../shared/types.js";
import { useRepeatingIPCCall } from "../../hooks/ipc.js";

const SourceCard = styled(Card)`
    .ant-card-body {
        padding: 16px;
    }
`;

function getVaultTypes() {
    return [
        {
            name: "Local",
            type: SourceType.File,
            icon: <AppleOutlined style={{ fontSize: "48px" }} />,
            description: "Store passwords locally with strong encryption"
        },
        {
            name: "Dropbox",
            type: SourceType.Dropbox,
            icon: <DropboxOutlined style={{ fontSize: "48px" }} />,
            description: "Sync passwords securely across devices"
        },
        {
            name: "Google Drive",
            type: SourceType.GoogleDrive,
            icon: <GoogleOutlined style={{ fontSize: "48px" }} />,
            description: "Sync passwords securely across devices"
        },
        {
            name: "WebDAV",
            type: SourceType.WebDAV,
            icon: <CloudUploadOutlined style={{ fontSize: "48px" }} />,
            description: "Sync passwords securely across devices"
        }
    ];
}

export function LandingPage() {
    const vaultTypes = useMemo(getVaultTypes, []);

    const { result: vaultsResult } = useRepeatingIPCCall("get_vaults_list", [], 5000);
    const vaults = useMemo(() => Array.isArray(vaultsResult) ? vaultsResult : [], [vaultsResult]);

    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const navigate = useNavigate();
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
                            icon: <VaultIcon size={64} vaultID={vault.id} />
                        }))}
                        renderItem={(item) => (
                            <List.Item>
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
                            </List.Item>
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
                                hoverable
                                style={{ textAlign: "center" }}
                                onClick={() =>
                                    navigate(`/add-vault/${type.type}`)
                                }
                            >
                                {type.icon}
                                <Typography.Title level={4}>
                                    {type.name}
                                </Typography.Title>
                                <Typography.Text type="secondary">
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
