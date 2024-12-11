import React, { ReactNode, useState } from "react";
import { Breadcrumb, Card, ConfigProvider, Layout, Menu } from "antd";
import { DesktopOutlined, FileOutlined, PieChartOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { useTheme } from "../../hooks/theme.js";
// import { Button, Group, H3, Input, ListItem, ScrollView, XStack, YGroup, YStack, XGroup, Card, H2, Label, SizableText, View, Text } from "tamagui";
// import { Shapes as IconAll, FileHeart as IconFavourites, FileClock as IconRecents, NotepadText as IconNote, Hash as IconTag, Search as IconSearch } from "@tamagui/lucide-icons";

interface Item {
    key: string;
    icon? : JSX.Element;
    children?: Array<Item>;
    label: string
}

function getItem(label: string, key: string, icon?: JSX.Element, children?: Array<Item>): Item {
    return {
        key,
        icon,
        children,
        label,
    };
}

export function VaultPage() {
    const [collapsed, setCollapsed] = useState(false);

    const items = [
        getItem('Option 1', '1', <PieChartOutlined />),
        getItem('Option 2', '2', <DesktopOutlined />),
        getItem('User', 'sub1', <UserOutlined />, [
          getItem('Tom', '3'),
          getItem('Bill', '4'),
          getItem('Alex', '5'),
        ]),
        getItem('Team', 'sub2', <TeamOutlined />, [getItem('Team 1', '6'), getItem('Team 2', '8')]),
        getItem('Files', '9', <FileOutlined />),
    ];

    // const {
    //     token: { colorBgContainer, borderRadiusLG },
    // } = useTheme()

    return (
        <Layout
            style={{
                minHeight: '100vh',
            }}
        >
            <Layout.Sider trigger={null} collapsible collapsed={collapsed}>
                <div className="demo-logo-vertical" />
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
            </Layout.Sider>
            <Layout.Sider trigger={null} collapsible collapsed={collapsed}>
                <div className="demo-logo-vertical" />
                <Menu defaultSelectedKeys={['1']} mode="inline" items={items} />
            </Layout.Sider>
            <Layout>
                {/* <Layout.Header
                    style={{
                        padding: 0,
                        background: "#0012ab",
                    }}
                /> */}
                <Layout.Content
                    style={{
                        margin: '0 16px',
                    }}
                >
                    {/* <Breadcrumb
                        style={{
                            margin: '16px 0',
                        }}
                    >
                        <Breadcrumb.Item>User</Breadcrumb.Item>
                        <Breadcrumb.Item>Bill</Breadcrumb.Item>
                    </Breadcrumb> */}
                    <Card title="My Entry">
                        <p>Some content</p>
                    </Card>
                    {/* <div
                        style={{
                            padding: 24,
                            minHeight: 360,
                            // background: "#0012ab",
                            borderRadius: 2,
                        }}
                    >
                        Bill is a cat.
                    </div> */}
                </Layout.Content>
                <Layout.Footer
                    style={{
                        textAlign: 'center',
                    }}
                >
                    Ant Design ©{new Date().getFullYear()} Created by Ant UED
                </Layout.Footer>
            </Layout>
        </Layout>
    );
    // return (
    //     <XStack width="100%" alignItems="stretch">
    //         <YStack maxWidth="350">
    //             <H3>My Vault</H3>
    //             <YGroup alignSelf="center" bordered>
    //                 <YGroup.Item>
    //                     <ListItem hoverTheme icon={IconAll}>
    //                         All Entries
    //                     </ListItem>
    //                 </YGroup.Item>
    //                 <YGroup.Item>
    //                     <ListItem hoverTheme icon={IconRecents}>
    //                         Recents
    //                     </ListItem>
    //                 </YGroup.Item>
    //                 <YGroup.Item>
    //                     <ListItem hoverTheme icon={IconFavourites}>
    //                         Favourites
    //                     </ListItem>
    //                 </YGroup.Item>
    //             </YGroup>
    //         </YStack>
    //         <YStack maxWidth="450">
    //             <Group orientation="horizontal">
    //                 <Input
    //                     flex={1}
    //                     placeholder="Search"
    //                 />
    //                 <Button icon={IconSearch} />
    //             </Group>
    //             <ScrollView>
    //                 <YGroup size="$4">
    //                     <YGroup.Item>
    //                         <ListItem
    //                             hoverTheme
    //                             icon={IconNote}
    //                             title="Shopping List"
    //                             subTitle={
    //                                 <XGroup alignItems="center" justifyContent="flex-start">
    //                                     <Button icon={IconTag} flexGrow={0} size="$1">social</Button>
    //                                 </XGroup>
    //                             }
    //                         />
    //                     </YGroup.Item>
    //                 </YGroup>
    //             </ScrollView>
    //         </YStack>
    //         <YStack>
    //             <H2>My Note</H2>
    //             <YStack padding="$2">
    //                 <XStack>
    //                     <Text width={200} fontWeight="bold">Property</Text>
    //                     <Text fontWeight="bold">Value</Text>
    //                 </XStack>
    //                 <XStack>
    //                     <Text width={200}>Username</Text>
    //                     <Text>perry@somewhere.com</Text>
    //                 </XStack>
    //             </YStack>
    //         </YStack>
    //     </XStack>
    // );
}
