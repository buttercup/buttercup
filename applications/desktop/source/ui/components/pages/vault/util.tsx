import { GroupFacade, GroupID } from "@buttercup/core";
import React, { ReactNode } from "react";
import { FolderOpenOutlined, FolderOutlined } from "@ant-design/icons";

export interface GroupTreeNode {
    children: Array<GroupTreeNode>;
    icon: ReactNode;
    key: string;
    title: string;
}

export const PASSWORD_MASK = "❋❋❋❋❋❋❋❋❋❋❋❋";

export function groupFacadesToTree(groups: Array<GroupFacade>, openGroups: Array<GroupID>, parentID: string | null = null): Array<GroupTreeNode> {
    return groups.reduce((output: Array<GroupTreeNode>, group: GroupFacade) => {
        if (!group.id) return output;

        if ((parentID === null && group.parentID === "0") || (parentID === group.parentID)) {
            return [
                ...output,
                {
                    children: groupFacadesToTree(groups, openGroups, group.id),
                    icon: openGroups.includes(group.id) ? <FolderOpenOutlined /> : <FolderOutlined />,
                    key: group.id,
                    title: group.title
                }
            ].sort((a, b) => a.title.localeCompare(b.title));
        }

        return output;
    }, []);
}
