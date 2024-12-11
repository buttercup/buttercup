import { AppleOutlined, CloudOutlined, CloudUploadOutlined, DatabaseOutlined, DeleteOutlined, DropboxOutlined, EditOutlined, GoogleOutlined, LinuxOutlined, LockOutlined } from "@ant-design/icons";
import { Card, Divider, Flex, Layout, List, Typography } from "antd";
import React, { useState } from "react";
import { styled } from "styled-components";
import { VaultIcon } from "../icons/VaultIcon.jsx";

// const CardWithAnimatedActions = styled<typeof Card, { actionsVisible: boolean }>(Card)`
//     width: 100%;

//     .ant-card-actions {
//         transition: 'all 0.3s ease';
//         opacity: ${p => p.actionsVisible ? "1" : "0"};
//         height: ${p => p.actionsVisible ? "48.75px" : "0px"};
//     }
// `;

export function LandingPage() {
    const vaultTypes = [
        { name: 'Local', icon: <AppleOutlined style={{fontSize: '48px'}} />, description: 'Store passwords locally with strong encryption' },
        { name: 'Dropbox', icon: <DropboxOutlined style={{fontSize: '48px'}} />, description: 'Sync passwords securely across devices' },
        { name: 'Google Drive', icon: <GoogleOutlined style={{fontSize: '48px'}} />, description: 'Sync passwords securely across devices' },
        { name: 'WebDAV', icon: <CloudUploadOutlined style={{fontSize: '48px'}} />, description: 'Sync passwords securely across devices' }
      ];

      const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout.Content style={{ display: 'flex' }}>
                <div style={{ flex: 1, padding: '24px' }}>
                    <Typography.Title level={2} style={{ textAlign: 'center' }}>Password Vaults</Typography.Title>
                    <List
                        style={{ width: '100%' }}
                        dataSource={[
                            { title: 'Personal Vault', icon: <VaultIcon size={64} vaultID="abc123" /> },
                            { title: 'Work Vault', icon: <VaultIcon size={64} vaultID="def456" /> }
                        ]}
                        renderItem={(item) => (
                            <List.Item>
                                <Card
                                    // actionsVisible={showActions}
                                    hoverable
                                    style={{ width: "100%" }}
                                    size="small"
                                    actions={hoveredItem === item.title ? [
                                        <EditOutlined key="edit" className="card-actions" />,
                                        <DeleteOutlined key="delete" className="card-actions" />
                                    ] : []}
                                    onMouseEnter={() => setHoveredItem(item.title)}
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

                <Divider type="vertical" style={{ height: 'auto' }} />

                <div style={{ flex: 1, padding: '24px' }}>
                    <Typography.Title level={2} style={{ textAlign: 'center' }}>Connect New Vault</Typography.Title>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {vaultTypes.map((type, index) => (
                            <Card key={index} hoverable style={{ textAlign: 'center' }}>
                                {type.icon}
                                <Typography.Title level={4}>{type.name}</Typography.Title>
                                <Typography.Text type="secondary">{type.description}</Typography.Text>
                            </Card>
                        ))}
                    </div>
                </div>
            </Layout.Content>
        </Layout>
    );
}
