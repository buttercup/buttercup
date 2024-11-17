import React from "react";
import { Button, H1, Paragraph, XStack, YStack } from "tamagui";
import { Plus as IconAdd } from "@tamagui/lucide-icons";

export function NoVaultsPage() {
    return (
        <XStack width="100%" alignItems="center">
            <YStack padding="$4">
                <H1>No Vaults</H1>
                <Paragraph>
                    No vaults have been added yet. Why not add one?
                </Paragraph>
                <Button icon={IconAdd}>Add Vault</Button>
            </YStack>
        </XStack>
    );
}
