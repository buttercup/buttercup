import React from "react";
import { App as Application, ConfigProvider } from 'antd';
import { VaultPage } from "./pages/VaultPage.jsx";
import { NoVaultsPage } from "./pages/NoVaultsPage.jsx";
import { VaultLockedPage } from "./pages/VaultLockedPage.jsx";
import { useTheme } from "../hooks/theme.js";

export function App() {
    const theme = useTheme();
    return (
        <ConfigProvider theme={theme}>
            <Application>
                <VaultPage />
            </Application>
        </ConfigProvider>
    );
}
