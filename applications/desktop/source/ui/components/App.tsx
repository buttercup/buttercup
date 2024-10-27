import React from "react";
import { TamaguiProvider } from "tamagui";
import { appConfig } from "../theme/config.js";
import { VaultPage } from "./pages/VaultPage.jsx";

export function App() {
    return (
        <TamaguiProvider config={appConfig}>
            <VaultPage />
        </TamaguiProvider>
    );
}
