import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App.jsx";

const root = document.getElementById("root");
if (!root) {
    throw new Error("No root element found");
}

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>
);
