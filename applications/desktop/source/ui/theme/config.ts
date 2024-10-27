import { createTamagui } from "tamagui";
import { config } from "@tamagui/config/v3";

export const appConfig = createTamagui(config);

export type AppConfig = typeof appConfig;
