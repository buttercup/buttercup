import { EditOutlined, FileTextOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Flex, Layout, Typography } from "antd";
import React from "react";

interface LocalFileRouterProps {
    page: string;
}

export function LocalFileRouter(props: LocalFileRouterProps) {
    const { page } = props;

    return (
        <Flex gap="middle" justify="space-between" align="stretch" style={{ marginTop: "22px" }}>
                {page === "choose-file" && (
                    <>
                        <div style={{ flex: 1, padding: "10px 24px" }}>
                            <Typography.Title level={4}>Add a new or existing vault</Typography.Title>
                            <Typography.Paragraph>
                                Browse to add an existing vault, or create an entirely new vault file. The choice is yours.
                            </Typography.Paragraph>
                        </div>

                        <Divider type="vertical" style={{ height: "auto" }} />

                        <div style={{ flex: 1, padding: "10px 24px", display: "flex", justifyContent: "center", flexDirection: "column" }}>
                            <Button size="large" icon={<EditOutlined />}>
                                Create New Vault
                            </Button>
                            <br />
                            <Button size="large" icon={<FileTextOutlined />}>
                                Open Vault File
                            </Button>
                        </div>
                    </>
                )}
        </Flex>
    );
}
