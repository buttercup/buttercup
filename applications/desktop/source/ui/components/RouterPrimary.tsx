import React from "react";
import { HashRouter, Route, Routes } from "react-router";
import { LandingPage } from "./pages/LandingPage.jsx";
import { AddVaultPage } from "./pages/add-vault/index.jsx";

export function RouterPrimary() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/add-vault/:type" element={<AddVaultPage />} />
                <Route path="/" element={<LandingPage />} />
            </Routes>
        </HashRouter>
    );
}
