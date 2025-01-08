import React, { useMemo, useState } from "react";
import { Avatar, Col, Descriptions, Divider, Flex, Layout, List, Menu, Progress, Row, Statistic, Tabs, Tag, theme, Tree, Typography } from "antd";
import {
    AppstoreOutlined,
    CarryOutOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    FormOutlined,
    GroupOutlined,
    LaptopOutlined,
    NotificationOutlined,
    ProfileOutlined,
    StarOutlined,
    TagsOutlined,
    UserOutlined
} from "@ant-design/icons";
import { styled } from "styled-components";
import { getUIEntryTypes } from "../../library/entryTypes.jsx";

interface Item {
    key: string;
    icon?: JSX.Element;
    children?: Array<Item>;
    label: string;
}

enum SidebarType {
    MainMenu = "menu",
    GroupTree = "groups",
    TagCloud = "tags"
}

const SidebarTabs = styled(Tabs)`
    .ant-tabs-nav {
        margin-top: 0;
    }
`;

const StatisticSmallSuffix = styled(Statistic)`
    .ant-statistic-content-suffix {
        font-size: 16px;
    }
`;

const TabbedSider = styled(Layout.Sider)`
    .ant-layout-sider-children {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
`;

function getSidebarMenu() {
    const entryTypes = getUIEntryTypes();
    return {
        default: "all-entries",
        items: [
            {
                key: "all-entries",
                icon: <AppstoreOutlined />,
                label: "All Entries"
            },
            {
                key: "favourites",
                icon: <StarOutlined />,
                label: "Favourites"
            },
            {
                key: "recents",
                icon: <ClockCircleOutlined />,
                label: "Recents"
            },
            {
                key: "entry-types",
                icon: <ProfileOutlined />,
                label: "Entry Types",
                children: entryTypes.map(item => ({
                    key: `entry-type:${item.entryType}`,
                    icon: item.icon,
                    label: item.title
                }))
            },
            {
                key: "trash",
                icon: <DeleteOutlined />,
                label: "Trash"
            }
        ]
    };
}

export function VaultPage() {
    const [collapsed, setCollapsed] = useState(false);
    const [sidebarType, setSidebarType] = useState<SidebarType>(SidebarType.MainMenu);

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

    const sidebarMenu = useMemo(getSidebarMenu, []);

    const tags = useMemo(() => [
        "social",
        "work",
        "finance",
        "email",
        "family",
        "torrents",
        "homelab",
        "shopping",
        "government"
    ], []);
    const [selectedTags, setSelectedTags] = useState<Array<string>>([]);

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
                <div style={{ flex: "1 1 auto", overflowY: "scroll" }}>
                    {sidebarType === SidebarType.MainMenu && (
                        <Menu
                            mode="inline"
                            defaultSelectedKeys={[sidebarMenu.default]}
                            style={{
                                height: '100%',
                                borderRight: 0
                            }}
                            items={sidebarMenu.items}
                        />
                    )}
                    {sidebarType === SidebarType.GroupTree && (
                        <Tree
                            showLine
                            showIcon
                            defaultExpandedKeys={['0-0-0']}
                            onSelect={() => {}}
                            treeData={treeData}
                        />
                    )}
                    {sidebarType === SidebarType.TagCloud && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center",
                                flexWrap: "wrap"
                            }}
                        >
                            {...tags.map(tag => (
                                <Tag.CheckableTag
                                    checked={selectedTags.includes(tag)}
                                    onChange={
                                        checked => checked
                                            ? setSelectedTags([...new Set([
                                                ...selectedTags,
                                                tag
                                            ])])
                                            : setSelectedTags(selectedTags => selectedTags.filter(selected => selected !== tag))
                                    }
                                >
                                    {tag}
                                </Tag.CheckableTag>
                            ))}
                        </div>
                    )}
                </div>
                <SidebarTabs
                    tabPosition="bottom"
                    centered
                    items={[
                        {
                            label: null,
                            icon: <AppstoreOutlined />,
                            key: SidebarType.MainMenu,
                            children: <></>
                        },
                        {
                            label: null,
                            icon: <GroupOutlined />,
                            key: SidebarType.GroupTree,
                            children: <></>
                        },
                        {
                            label: null,
                            icon: <TagsOutlined />,
                            key: SidebarType.TagCloud,
                            children: <></>
                        }
                    ]}
                    activeKey={sidebarType}
                    onTabClick={(tabKey: string) => setSidebarType(tabKey as SidebarType)}
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
                    <Typography.Title level={2} style={{ marginTop: 0 }}>Deezer</Typography.Title>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic title="Logins" value={5} />
                        </Col>
                        <Col span={6}>
                            <Statistic title="Page Opened" value={8} />
                        </Col>
                        <Col span={6}>
                            <StatisticSmallSuffix title="Password Updated" suffix="days ago" value={8} />
                        </Col>
                        <Col span={6}>
                        <StatisticSmallSuffix title="Created" suffix="months ago" value={5} />
                        </Col>
                    </Row>
                    <Divider />
                    <Descriptions
                        title="Login"
                        bordered
                        column={2}
                        size="small"
                        items={[
                            { key: "username", label: "Username", children: "user@email.com" },
                            { key: "password", label: "Password", children: "❋❋❋❋❋❋❋❋❋❋❋❋" },
                            { key: "url", label: "URL", children: <Typography.Link>www.some-website.com</Typography.Link> },
                            {
                                key: "otp",
                                label: "OTP",
                                children: (
                                    <Flex gap="middle" justify="flex-start" align="center">
                                        <Progress
                                            type="circle"
                                            trailColor="#e6f4ff"
                                            percent={60}
                                            strokeWidth={20}
                                            size={22}
                                            format={() => ""}
                                        />
                                        <Typography.Title style={{ margin: 0 }} level={3}>293 102</Typography.Title>
                                    </Flex>
                                )
                            },
                            { key: "backup", label: "Backup Codes", children: "ASDNO394884\nDS3NO394884\nASDNO394884\nXSDNO364884" },
                        ]}
                    />
                    {/* <Divider />
                    <div>
                        <Card style={{ width: "58px", padding: "0px" }}>
                            <FileZipOutlined/>
                        </Card>
                    </div> */}
                </Layout.Content>
            </Layout>
        </Layout>
    );
}
