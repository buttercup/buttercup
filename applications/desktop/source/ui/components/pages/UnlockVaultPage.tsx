import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Flex, Form, Input, Typography } from "antd";
import { VaultSourceID } from "@buttercup/core";
import { NestedPageLayout } from "../layouts/NestedPageLayout.jsx";
import { useIPCCall } from "../../hooks/ipc.js";
import { useNotification } from "../../hooks/notifications.js";
import { LoadingModal } from "../modals/LoadingModal.jsx";

type UnlockVaultPageParams = {
    id: VaultSourceID;
};

export function UnlockVaultPage() {
    const { id } = useParams<UnlockVaultPageParams>();
    if (!id) {
        throw new Error(`Invalid vault ID: ${id}`);
    }

    const navigate = useNavigate();
    const notification = useNotification();

    const [password, setPassword] = useState<string>("");
    const [unlocking, setUnlocking] = useState<boolean>(false);

    const handleVaultUnlocked = useCallback(
        (error: string | null) => {
            setUnlocking(false);

            if (error) {
                notification.error({
                    message: "Failed unlocking",
                    description: `Error unlocking vault ${id}: ${error}`
                });
                return;
            }

            notification.success({
                message: "Vault unlocked",
                description: "Successfully unlocked vault using password"
            });
            navigate(`/vault/${id}`);
        },
        [id, navigate, notification]
    );
    const { execute: executeUnlockVault } = useIPCCall(
        "unlock_vault",
        handleVaultUnlocked
    );
    const handleUnlock = useCallback(() => {
        if (password.length <= 0) return;
        setUnlocking(true);

        executeUnlockVault(id, password);
    }, [executeUnlockVault, id, password]);

    return (
        <NestedPageLayout
            breadcrumbs={[
                { key: "home", path: "/", text: "Home" },
                { key: "unlock-vault", path: null, text: "Unlock Vault" }
            ]}
        >
            <Flex
                gap="middle"
                vertical
                justify="center"
                align="center"
                style={{ marginTop: "22px", flex: "1 1 auto" }}
            >
                <Typography.Title level={4}>Unlock Vault</Typography.Title>
                <Typography.Paragraph>
                    Enter your vault password to unlock it.
                </Typography.Paragraph>
                <Form name="unlock-vault" layout="vertical" variant="outlined">
                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            {
                                required: true
                            }
                        ]}
                    >
                        <Input
                            autoFocus
                            type="password"
                            disabled={unlocking}
                            value={password}
                            onChange={(evt) => setPassword(evt.target.value)}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            onClick={() => handleUnlock()}
                            disabled={password.length <= 0 || unlocking}
                        >
                            Unlock
                        </Button>
                    </Form.Item>
                </Form>
            </Flex>
            <LoadingModal open={unlocking} text="Unlocking Vault" />
        </NestedPageLayout>
    );
}
