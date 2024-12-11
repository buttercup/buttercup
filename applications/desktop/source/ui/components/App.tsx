import React from "react";
import { App as Application, ConfigProvider } from 'antd';
import { useTheme } from "../hooks/theme.js";
import { RouterPrimary } from "./RouterPrimary.jsx";

export function App() {
    const theme = useTheme();
    return (
        <ConfigProvider theme={theme}>
            <Application>
                <RouterPrimary />
            </Application>
        </ConfigProvider>
    );
}
