import { ThemeConfig } from "antd";
import { useMemo } from "react";
import { getTheme } from "../theme/index.js";

export function useTheme(): ThemeConfig {
    return useMemo(getTheme, []);
}
