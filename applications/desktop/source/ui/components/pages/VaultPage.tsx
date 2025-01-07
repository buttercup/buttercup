import React, { useMemo, useState } from "react";
import { Avatar, Breadcrumb, Card, Flex, Layout, List, Menu, Tabs, theme, Tree } from "antd";
import {
    AppstoreOutlined,
    CarryOutOutlined,
    DesktopOutlined,
    FileOutlined,
    FormOutlined,
    GroupOutlined,
    LaptopOutlined,
    MenuOutlined,
    NotificationOutlined,
    NumberOutlined,
    PieChartOutlined,
    TagsOutlined,
    TeamOutlined,
    UserOutlined
} from "@ant-design/icons";
import { styled } from "styled-components";

interface Item {
    key: string;
    icon?: JSX.Element;
    children?: Array<Item>;
    label: string;
}

const TabbedSider = styled(Layout.Sider)`
    .ant-layout-sider-children {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
`;

export function VaultPage() {
    const [collapsed, setCollapsed] = useState(false);

    const treeData = useMemo(() => [
        {
          title: 'parent 1',
          key: '0-0',
          icon: <CarryOutOutlined />,
          children: [
            {
              title: 'parent 1-0',
              key: '0-0-0',
              icon: <CarryOutOutlined />,
              children: [
                {
                  title: 'leaf',
                  key: '0-0-0-0',
                  icon: <CarryOutOutlined />,
                },
                {
                  title: (
                    <>
                      <div>multiple line title</div>
                      <div>multiple line title</div>
                    </>
                  ),
                  key: '0-0-0-1',
                  icon: <CarryOutOutlined />,
                },
                {
                  title: 'leaf',
                  key: '0-0-0-2',
                  icon: <CarryOutOutlined />,
                },
              ],
            },
            {
              title: 'parent 1-1',
              key: '0-0-1',
              icon: <CarryOutOutlined />,
              children: [
                {
                  title: 'leaf',
                  key: '0-0-1-0',
                  icon: <CarryOutOutlined />,
                },
              ],
            },
            {
              title: 'parent 1-2',
              key: '0-0-2',
              icon: <CarryOutOutlined />,
              children: [
                {
                  title: 'leaf',
                  key: '0-0-2-0',
                  icon: <CarryOutOutlined />,
                },
                {
                  title: 'leaf',
                  key: '0-0-2-1',
                  icon: <CarryOutOutlined />,
                  switcherIcon: <FormOutlined />,
                },
              ],
            },
          ],
        },
        {
          title: 'parent 2',
          key: '0-1',
          icon: <CarryOutOutlined />,
          children: [
            {
              title: 'parent 2-0',
              key: '0-1-0',
              icon: <CarryOutOutlined />,
              children: [
                {
                  title: 'leaf',
                  key: '0-1-0-0',
                  icon: <CarryOutOutlined />,
                },
                {
                  title: 'leaf',
                  key: '0-1-0-1',
                  icon: <CarryOutOutlined />,
                },
              ],
            },
          ],
        },
      ],
      []
    );

    const [entries, setEntries] = useState<Array<{
        description: string;
        icon: string;
        id: string;
        title: string;
    }>>([
        {
            id: "550e8400-e29b-41d4-a716-446655440000",
            title: "Google",
            description: "Main Google account for all Google services",
            icon: "https://placedog.net/48"
        },
        {
            id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            title: "GitHub",
            description: "Developer account and repositories",
            icon: "https://placedog.net/48"
        },
        {
            id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
            title: "Amazon",
            description: "Online shopping and Prime subscription",
            icon: "https://placedog.net/48"
        },
        {
            id: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
            title: "Netflix",
            description: "Streaming service subscription",
            icon: "https://placedog.net/48"
        },
        {
            id: "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
            title: "Spotify",
            description: "Music streaming premium account",
            icon: "https://placedog.net/48"
        },
        {
            id: "6ba7b813-9dad-11d1-80b4-00c04fd430c9",
            title: "Facebook",
            description: "Social media site",
            icon: "https://placedog.net/48"
        },
        {
            id: "6ba7b813-9dad-11d1-80b4-00c04fd430c0",
            title: "Deezer",
            description: "Music streaming account",
            icon: "https://placedog.net/48"
        }
    ]);

    // const items1 = ['1', '2', '3'].map((key) => ({
    //     key,
    //     label: `nav ${key}`,
    // }));
    const items2 = [UserOutlined, LaptopOutlined, NotificationOutlined].map((icon, index) => {
        const key = String(index + 1);
        return {
            key: `sub${key}`,
            icon: React.createElement(icon),
            label: `subnav ${key}`,
            children: new Array(4).fill(null).map((_, j) => {
                const subKey = index * 4 + j + 1;
                return {
                    key: subKey,
                    label: `option${subKey}`,
                };
            }),
        };
    });

    const {
        token: { colorBgContainer, borderRadiusLG, colorBorder },
      } = theme.useToken();

    return (
        <Layout
            style={{
                height: "100vh"
            }}
        >
            <TabbedSider
                width={200}
                style={{
                    background: colorBgContainer,
                    borderRightStyle: "solid",
                    borderRightWidth: "1px",
                    borderRightColor: colorBorder
                }}
            >
                <div style={{ flex: "1 1 auto" }}>
                    <Menu
                        mode="inline"
                        defaultSelectedKeys={['1']}
                        defaultOpenKeys={['sub1']}
                        style={{
                            height: '100%',
                            borderRight: 0
                        }}
                        items={items2}
                    />
                </div>
                <Tabs
                    tabPosition="bottom"
                    centered
                    items={[
                        {
                            label: null,
                            icon: <AppstoreOutlined />,
                            key: "menu",
                            children: <></>
                        },
                        {
                            label: null,
                            icon: <GroupOutlined />,
                            key: "groups",
                            children: <></>
                        },
                        {
                            label: null,
                            icon: <TagsOutlined />,
                            key: "tags",
                            children: <></>
                        }
                    ]}
                    // items={new Array(3).fill(null).map((_, i) => {
                    //     const id = String(i + 1);
                    //     return {
                    //         label: `Tab ${id}`,
                    //         key: id,
                    //         children: `Content of Tab ${id}`,
                    //     };
                    // })}
                />
            </TabbedSider>
            <Layout
                style={{
                    maxWidth: "280px",
                    borderRightStyle: "solid",
                    borderRightWidth: "1px",
                    borderRightColor: colorBorder
                }}
            >
                <Layout.Content
                    style={{
                        background: colorBgContainer,
                        height: "100%",
                        overflowY: "scroll",
                        padding: "0 16px"
                    }}
                >
                    <List
                        dataSource={entries}
                        renderItem={(item) => (
                            <List.Item key={item.id}>
                                <List.Item.Meta
                                    avatar={<Avatar src={item.icon} />}
                                    title={<a href="https://ant.design">{item.title}</a>}
                                    description={item.description}
                                />
                                <div>Content</div>
                            </List.Item>
                        )}
                    />
                </Layout.Content>
            </Layout>
            <Layout
                style={{
                    padding: '24px 24px',
                }}
            >
                <Layout.Content
                    style={{
                        padding: 24,
                        margin: 0,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    Content
                </Layout.Content>
            </Layout>
        </Layout>
    );
}
