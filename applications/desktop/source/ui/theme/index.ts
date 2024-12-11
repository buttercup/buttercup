import { ThemeConfig } from "antd";

export function getTheme(): ThemeConfig {
    return {
        token: {
            // Seed Token
            colorPrimary: '#00b96b',
            borderRadius: 2,

            // Alias Token
            colorBgContainer: '#f6ffed',
        }
    };
}
