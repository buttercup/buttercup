import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    ClockCircleOutlined,
    DeleteOutlined,
    GroupOutlined,
    ProfileOutlined,
    StarOutlined,
    TagsOutlined
} from "@ant-design/icons";
import { EntryID, GroupID, VaultSourceID } from "@buttercup/core";
import { useParams } from "react-router";
import { styled } from "styled-components";
import { getUIEntryTypes } from "../../../library/entryTypes.jsx";
import { useVaultEditInterface } from "../../../hooks/vaultEdit.js";
import { useAsync } from "../../../hooks/async.js";
import { MenuItemType } from "antd/es/menu/interface.js";
import { VaultEntry } from "./VaultEntry.jsx";
import { VAULT_EDIT_MIN_WIDTH_DETAILS, VAULT_EDIT_MIN_WIDTH_ENTRIES, VAULT_EDIT_MIN_WIDTH_MENU } from "../../../../shared/symbols.js";
import { useConfig } from "../../../hooks/config.js";
import { groupFacadesToTree } from "./util.jsx";

enum SidebarType {
    MainMenu = "menu",
    GroupTree = "groups",
    TagCloud = "tags",
    Trash = "trash"
}

type VaultPageParams = {
    id: VaultSourceID;
};

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

    const vaultEdit = useVaultEditInterface(sourceID);

    const groupFacadesLoader = useCallback(async () => {
        return sidebarType === SidebarType.GroupTree
            ? vaultEdit.getAllGroups()
            : [];
    }, [vaultEdit, sidebarType]);
    const { result: groupFacades } = useAsync(groupFacadesLoader);
    const [openedGroups, setOpenedGroups] = useState<Array<GroupID>>([]);
    const groupTree = useMemo(() => {
        if (!groupFacades) return [];
        return groupFacadesToTree(groupFacades, openedGroups);
    }, [groupFacades, openedGroups]);

    const [groupTreeSelectedGroupID, setGroupTreeSelectedGroupID] = useState<GroupID | null>(null);
    useEffect(() => {
        const firstID = groupTree[0]?.key ?? null;
        // Check if none selected - select first
        if (!groupTreeSelectedGroupID) {
            setGroupTreeSelectedGroupID(firstID);
            return;
        }
        // Check if still exists
        const existing = groupFacades?.find(facade => facade.id === groupTreeSelectedGroupID);
        if (!existing) {
            setGroupTreeSelectedGroupID(firstID);
        }
    }, [groupTreeSelectedGroupID, groupTree, groupFacades]);

    const entryLoader = useCallback(async () => {
        if (sidebarType === SidebarType.GroupTree) {
            return groupTreeSelectedGroupID ? vaultEdit.getGroupEntryDetails(groupTreeSelectedGroupID) : [];
        }
        return vaultEdit.getAllEntryDetails();
    }, [vaultEdit, sidebarType, groupTreeSelectedGroupID]);

    const {
        result: entries,
        running: fetchingEntries,
        runs: entryFetchCount
    } = useAsync(entryLoader);

    const listRef = useRef<HTMLDivElement | null>(null);
    const entriesListKey = useMemo(() => {
        if (sidebarType === SidebarType.GroupTree) {
            return `${sidebarType}:${groupTreeSelectedGroupID ?? "-"}`;
        }
        return sidebarType;
    }, [sidebarType, groupTreeSelectedGroupID]);
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTo(0, 0);
        }
    }, [entriesListKey]);

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

    const { config, setConfigValue } = useConfig();
    const setSeparatorSizes = useCallback((sizes: Array<number>) => {
        const [menuWidth, entriesWidth] = sizes;
        if (menuWidth > 0 && entriesWidth > 0) {
            setConfigValue("vaultEditSplitMenuWidth", menuWidth);
            setConfigValue("vaultEditSplitEntriesWidth", entriesWidth);
        }
    }, [setConfigValue]);

    const {
        token: { colorBgContainer, colorInfoBg, colorInfoBgHover, borderRadiusLG }
    } = theme.useToken();

    return (
        <Layout
            style={{
                height: "100vh"
            }}
        >
            <Splitter onResize={setSeparatorSizes}>
                <Splitter.Panel
                    min={VAULT_EDIT_MIN_WIDTH_MENU}
                    defaultSize={VAULT_EDIT_MIN_WIDTH_MENU}
                    size={config?.vaultEditSplitMenuWidth}
                >
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
                                    expandedKeys={openedGroups}
                                    onExpand={(expanded) => setOpenedGroups(expanded.map(item => item.toString()))}
                                    onSelect={(selected) => setGroupTreeSelectedGroupID(selected[0]?.toString() ?? null)}
                                    selectedKeys={groupTreeSelectedGroupID ? [groupTreeSelectedGroupID] : []}
                                    showIcon
                                    showLine
                                    treeData={groupTree}
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
                <Splitter.Panel
                    min={VAULT_EDIT_MIN_WIDTH_ENTRIES}
                    defaultSize={VAULT_EDIT_MIN_WIDTH_ENTRIES}
                    size={config?.vaultEditSplitEntriesWidth}
                >
                    <Layout
                        style={{
                            height: "100%"
                        }}
                    >
                        <Layout.Content
                            style={{
                                background: colorBgContainer,
                                height: "100%",
                                overflow: "hidden",
                                // overflowY: "scroll",
                                // padding: "0 16px"
                            }}
                        >
                            <List
                                dataSource={entryList}
                                ref={listRef}
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
                                style={{
                                    height: "100%",
                                    overflowY: "scroll",
                                    padding: "0 16px"
                                }}
                            />
                        </Layout.Content>
                    </Layout>
                </Splitter.Panel>
                <Splitter.Panel min={VAULT_EDIT_MIN_WIDTH_DETAILS}>
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
