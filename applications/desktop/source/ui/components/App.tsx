import React from "react";
import { App as Application, ConfigProvider } from "antd";
import { useTheme } from "../hooks/theme.js";
import { RouterPrimary } from "./RouterPrimary.jsx";
import { NotificationProvider } from "../contexts/NotificationContext.jsx";

export function App() {
    const theme = useTheme();
    return (
        <ConfigProvider theme={theme}>
            <Application>
                <NotificationProvider>
                    <RouterPrimary />
                </NotificationProvider>
            </Application>
        </ConfigProvider>
    );
}
