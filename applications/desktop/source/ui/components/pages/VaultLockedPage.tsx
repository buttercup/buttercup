import React from "react";
import { Button, H2, XStack, YStack } from "tamagui";
import { KeySquare as IconUnlock } from "@tamagui/lucide-icons";
import { VaultIcon } from "../icons/VaultIcon.jsx";

export function VaultLockedPage() {
    return (
        <XStack width="100%" alignItems="center">
            <YStack padding="$4">
                <H2>My Vault</H2>
                <VaultIcon vaultID="abc123" />
                <Button icon={IconUnlock}>Unlock</Button>
            </YStack>
        </XStack>
    );
}
