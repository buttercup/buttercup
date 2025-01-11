import React from "react";
import { useParams } from "react-router";
import { SourceType } from "../../../../shared/types.js";
import { LocalFileRouter } from "./LocalFileRouter.jsx";
import { NestedPageLayout } from "../../layouts/NestedPageLayout.jsx";

type AddVaultPageParams = {
    type: SourceType;
};

export function AddVaultPage() {
    const { type } = useParams<AddVaultPageParams>();
    if (!type) {
        throw new Error(`Invalid type: ${type}`);
    }

    return (
        <NestedPageLayout
            breadcrumbs={[
                { path: "/", text: "Home" },
                { path: null, text: "Add Vault" }
            ]}
        >
            {type === SourceType.File && <LocalFileRouter />}
        </NestedPageLayout>
    );
}
