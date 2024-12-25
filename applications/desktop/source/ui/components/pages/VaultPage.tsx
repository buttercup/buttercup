import React, { useState } from "react";
import { Card, Layout, Menu } from "antd";
import {
    DesktopOutlined,
    FileOutlined,
    PieChartOutlined,
    TeamOutlined,
    UserOutlined
} from "@ant-design/icons";

interface Item {
    key: string;
    icon?: JSX.Element;
    children?: Array<Item>;
    label: string;
}

function getItem(
    label: string,
    key: string,
    icon?: JSX.Element,
    children?: Array<Item>
): Item {
    return {
        key,
        icon,
        children,
        label
    };
}

export function VaultPage() {
    const [collapsed, setCollapsed] = useState(false);

    const items = [
        getItem("Option 1", "1", <PieChartOutlined />),
        getItem("Option 2", "2", <DesktopOutlined />),
        getItem("User", "sub1", <UserOutlined />, [
            getItem("Tom", "3"),
            getItem("Bill", "4"),
            getItem("Alex", "5")
        ]),
        getItem("Team", "sub2", <TeamOutlined />, [
            getItem("Team 1", "6"),
            getItem("Team 2", "8")
        ]),
        getItem("Files", "9", <FileOutlined />)
    ];

    return (
        <Layout
            style={{
                minHeight: "100vh"
            }}
        >
            <Layout.Sider trigger={null} collapsible collapsed={collapsed}>
                <div className="demo-logo-vertical" />
                <Menu
                    theme="dark"
                    defaultSelectedKeys={["1"]}
                    mode="inline"
                    items={items}
                />
            </Layout.Sider>
            <Layout.Sider trigger={null} collapsible collapsed={collapsed}>
                <div className="demo-logo-vertical" />
                <Menu defaultSelectedKeys={["1"]} mode="inline" items={items} />
            </Layout.Sider>
            <Layout>
                <Layout.Content
                    style={{
                        margin: "0 16px"
                    }}
                >
                    <Card title="My Entry">
                        <p>Some content</p>
                    </Card>
                </Layout.Content>
                <Layout.Footer
                    style={{
                        textAlign: "center"
                    }}
                >
                    Ant Design ©{new Date().getFullYear()} Created by Ant UED
                </Layout.Footer>
            </Layout>
        </Layout>
    );
}
