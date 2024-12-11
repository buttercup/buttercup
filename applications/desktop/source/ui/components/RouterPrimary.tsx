import React from "react";
import { HashRouter, Route, Routes } from "react-router";
import { LandingPage } from "./pages/LandingPage.jsx";

export function RouterPrimary() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
            </Routes>
        </HashRouter>
    );
}
