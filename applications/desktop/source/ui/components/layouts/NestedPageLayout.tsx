import React, { ReactNode } from "react";
import { Breadcrumb, Layout, theme } from "antd";
import { styled } from "styled-components";

interface NestedPageLayoutProps {
    breadcrumbs: Array<{
        path: string | null;
        text: string;
    }>;
    children: ReactNode;
}

const BreadcrumbItem = styled(Breadcrumb.Item)`
    user-select: none;
`;

export function NestedPageLayout(props: NestedPageLayoutProps) {
    const {
        token: { colorBgContainer, borderRadiusLG }
    } = theme.useToken();

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Layout.Content
                style={{
                    padding: "0 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                }}
            >
                <Breadcrumb
                    style={{
                        margin: "16px 0",
                        flex: "0 0 auto"
                    }}
                >
                    {props.breadcrumbs.map((breadcrumb) => (
                        <BreadcrumbItem
                            href={
                                breadcrumb.path
                                    ? `#${breadcrumb.path}`
                                    : undefined
                            }
                        >
                            {breadcrumb.text}
                        </BreadcrumbItem>
                    ))}
                </Breadcrumb>
                <div
                    style={{
                        padding: 24,
                        marginBottom: 24,
                        flex: "1 1 auto",
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                    }}
                >
                    {props.children}
                </div>
            </Layout.Content>
        </Layout>
    );
}
