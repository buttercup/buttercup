import React, { useCallback, useMemo, useState } from "react";
import {
    Avatar,
    Empty,
    Layout,
    List,
    Menu,
    Splitter,
    Tabs,
    Tag,
    theme,
    Tree
} from "antd";
import {
    AppstoreOutlined,
    CarryOutOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    FormOutlined,
    GroupOutlined,
    ProfileOutlined,
    StarOutlined,
    TagsOutlined
} from "@ant-design/icons";
import { EntryFacade, EntryID, VaultSourceID } from "@buttercup/core";
import { useParams } from "react-router";
import { styled } from "styled-components";
import { getUIEntryTypes } from "../../../library/entryTypes.jsx";
import { useVaultEditInterface } from "../../../hooks/vaultEdit.js";
import { useAsync } from "../../../hooks/async.js";
import { MenuItemType } from "antd/es/menu/interface.js";
import { VaultEntry } from "./VaultEntry.jsx";

enum SidebarType {
    MainMenu = "menu",
    GroupTree = "groups",
    TagCloud = "tags",
    Trash = "trash"
}

type VaultPageParams = {
    id: VaultSourceID;
};

const MIN_WIDTH_DETAILS = 410;
const MIN_WIDTH_ENTRIES = 300;
const MIN_WIDTH_MENU = 200;

const ListItemClickable = styled(List.Item)<{ hoverBgColour: string; selected: boolean; selectedBgColor: string; }>`
    background-color: ${props => props.selected ? props.selectedBgColor : "inherit"};

    &:hover {
        background-color: ${props => props.hoverBgColour};
        cursor: pointer;
    }
`;

const NoEntrySelected = styled(Empty)`
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 0;
`;

const SidebarTabs = styled(Tabs)`
    .ant-tabs-nav {
        margin-top: 0;
    }
`;

const TabbedSider = styled(Layout.Sider)`
    .ant-layout-sider-children {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
`;

function getSidebarMenu(): {
    default: string;
    items: Array<MenuItemType & {
        children?: Array<MenuItemType>;
    }>;
} {
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
                label: "Favourites",
                disabled: true
            },
            {
                key: "recents",
                icon: <ClockCircleOutlined />,
                label: "Recents",
                disabled: true
            },
            {
                key: "entry-types",
                icon: <ProfileOutlined />,
                label: "Entry Types",
                children: entryTypes.map((item) => ({
                    key: `entry-type:${item.entryType}`,
                    icon: item.icon,
                    label: item.title
                }))
            }
        ]
    };
}

export function VaultPage() {
    const { id: sourceID } = useParams<VaultPageParams>();
    if (!sourceID) {
        throw new Error("Vault source ID required for vault page");
    }

    const [sidebarType, setSidebarType] = useState<SidebarType>(
        SidebarType.MainMenu
    );

    const treeData = useMemo(
        () => [
            {
                title: "parent 1",
                key: "0-0",
                icon: <CarryOutOutlined />,
                children: [
                    {
                        title: "parent 1-0",
                        key: "0-0-0",
                        icon: <CarryOutOutlined />,
                        children: [
                            {
                                title: "leaf",
                                key: "0-0-0-0",
                                icon: <CarryOutOutlined />
                            },
                            {
                                title: (
                                    <>
                                        <div>multiple line title</div>
                                        <div>multiple line title</div>
                                    </>
                                ),
                                key: "0-0-0-1",
                                icon: <CarryOutOutlined />
                            },
                            {
                                title: "leaf",
                                key: "0-0-0-2",
                                icon: <CarryOutOutlined />
                            }
                        ]
                    },
                    {
                        title: "parent 1-1",
                        key: "0-0-1",
                        icon: <CarryOutOutlined />,
                        children: [
                            {
                                title: "leaf",
                                key: "0-0-1-0",
                                icon: <CarryOutOutlined />
                            }
                        ]
                    },
                    {
                        title: "parent 1-2",
                        key: "0-0-2",
                        icon: <CarryOutOutlined />,
                        children: [
                            {
                                title: "leaf",
                                key: "0-0-2-0",
                                icon: <CarryOutOutlined />
                            },
                            {
                                title: "leaf",
                                key: "0-0-2-1",
                                icon: <CarryOutOutlined />,
                                switcherIcon: <FormOutlined />
                            }
                        ]
                    }
                ]
            },
            {
                title: "parent 2",
                key: "0-1",
                icon: <CarryOutOutlined />,
                children: [
                    {
                        title: "parent 2-0",
                        key: "0-1-0",
                        icon: <CarryOutOutlined />,
                        children: [
                            {
                                title: "leaf",
                                key: "0-1-0-0",
                                icon: <CarryOutOutlined />
                            },
                            {
                                title: "leaf",
                                key: "0-1-0-1",
                                icon: <CarryOutOutlined />
                            }
                        ]
                    }
                ]
            }
        ],
        []
    );

    const vaultEdit = useVaultEditInterface(sourceID);
    const entryLoader = useCallback(async () => {
        return vaultEdit.getAllEntryDetails();
    }, [vaultEdit]);

    const {
        result: entries,
        running: fetchingEntries,
        runs: entryFetchCount
    } = useAsync(entryLoader);

    const entryList = useMemo(
        () =>
            Array.isArray(entries)
                ? entries.map((entry) => ({
                      description: "Test",
                      icon: "https://placedog.net/48",
                      id: entry.id,
                      title: entry.title,
                      type: entry.type
                  }))
                : [],
        [entries]
    );

    const [entryID, setEntryID] = useState<EntryID | null>(null);
    const loadEntry = useCallback(async () => {
        if (!entryID) return null;
        return vaultEdit.getEntry(entryID);
    }, [entryID, vaultEdit]);
    const { result: entry } = useAsync(loadEntry, [], true);

    const sidebarMenu = useMemo(getSidebarMenu, []);

    const tags = useMemo(
        () => [
            "social",
            "work",
            "finance",
            "email",
            "family",
            "torrents",
            "homelab",
            "shopping",
            "government"
        ],
        []
    );
    const [selectedTags, setSelectedTags] = useState<Array<string>>([]);

    const {
        token: { colorBgContainer, colorInfoBg, colorInfoBgHover, borderRadiusLG }
    } = theme.useToken();

    return (
        <Layout
            style={{
                height: "100vh"
            }}
        >
            <Splitter>
                <Splitter.Panel min={MIN_WIDTH_MENU} defaultSize={MIN_WIDTH_MENU}>
                    <TabbedSider
                        width="100%"
                        style={{
                            background: colorBgContainer,
                            height: "100%"
                        }}
                    >
                        <div style={{ flex: "1 1 auto", overflowY: "scroll" }}>
                            {sidebarType === SidebarType.MainMenu && (
                                <Menu
                                    mode="inline"
                                    defaultSelectedKeys={[sidebarMenu.default]}
                                    style={{
                                        height: "100%",
                                        borderRight: 0
                                    }}
                                    items={sidebarMenu.items}
                                />
                            )}
                            {sidebarType === SidebarType.GroupTree && (
                                <Tree
                                    showLine
                                    showIcon
                                    defaultExpandedKeys={["0-0-0"]}
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
                                    {...tags.map((tag) => (
                                        <Tag.CheckableTag
                                            key={tag}
                                            checked={selectedTags.includes(tag)}
                                            onChange={(checked) =>
                                                checked
                                                    ? setSelectedTags([
                                                            ...new Set([
                                                                ...selectedTags,
                                                                tag
                                                            ])
                                                        ])
                                                    : setSelectedTags((selectedTags) =>
                                                            selectedTags.filter(
                                                                (selected) =>
                                                                    selected !== tag
                                                            )
                                                        )
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
                                    children: <></>,
                                    disabled: true
                                },
                                {
                                    label: null,
                                    icon: <DeleteOutlined />,
                                    key: SidebarType.Trash,
                                    children: <></>
                                }
                            ]}
                            activeKey={sidebarType}
                            onTabClick={(tabKey: string) =>
                                setSidebarType(tabKey as SidebarType)
                            }
                        />
                    </TabbedSider>
                </Splitter.Panel>
                <Splitter.Panel min={MIN_WIDTH_ENTRIES} defaultSize={MIN_WIDTH_ENTRIES}>
                    <Layout>
                        <Layout.Content
                            style={{
                                background: colorBgContainer,
                                height: "100%",
                                overflowY: "scroll",
                                padding: "0 16px"
                            }}
                        >
                            <List
                                dataSource={entryList}
                                renderItem={(item) => (
                                    <ListItemClickable
                                        key={item.id}
                                        hoverBgColour={colorInfoBgHover}
                                        onClick={() => setEntryID(item.id)}
                                        selected={item.id === entry?.id}
                                        selectedBgColor={colorInfoBg}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar src={item.icon} />}
                                            title={item.title}
                                            description={item.description}
                                        />
                                        <div>Content</div>
                                    </ListItemClickable>
                                )}
                            />
                        </Layout.Content>
                    </Layout>
                </Splitter.Panel>
                <Splitter.Panel min={MIN_WIDTH_DETAILS}>
                    <Layout
                        style={{
                            display: "block",
                            overflowY: "scroll",
                            padding: "24px"
                        }}
                    >
                        {entry && (
                            <Layout.Content
                                style={{
                                    padding: 24,
                                    margin: 0,
                                    overflow: "hidden",
                                    background: colorBgContainer,
                                    borderRadius: borderRadiusLG
                                }}
                            >
                                <VaultEntry entry={entry} />
                            </Layout.Content>
                        )}
                        {!entry && (
                            <Layout.Content
                                style={{
                                    margin: 0,
                                    height: "100%"
                                }}
                            >
                                <NoEntrySelected image={Empty.PRESENTED_IMAGE_SIMPLE} description="No entry selected" />
                            </Layout.Content>
                        )}
                    </Layout>
                </Splitter.Panel>
            </Splitter>
        </Layout>
    );
}
