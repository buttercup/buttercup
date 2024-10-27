import React from "react";
import { Card, H2, H3, ListItem, XStack, YGroup, YStack } from "tamagui";
import { Moon, Star, Sun } from "@tamagui/lucide-icons";

export function VaultPage() {
    return (
        <XStack width="100%" alignItems="stretch">
            <YStack maxWidth="350">
                <Card elevate size="$4" bordered>
                    <Card.Header>
                        <H3>Groups</H3>
                    </Card.Header>
                    <YGroup alignSelf="center" bordered>
                        <YGroup.Item>
                            <ListItem hoverTheme icon={Moon}>
                                Test 1
                            </ListItem>
                        </YGroup.Item>
                        <YGroup.Item>
                            <ListItem hoverTheme icon={Sun}>
                                Test 2
                            </ListItem>
                        </YGroup.Item>
                        <YGroup.Item>
                            <ListItem hoverTheme icon={Star}>
                                Test 3
                            </ListItem>
                        </YGroup.Item>
                    </YGroup>
                </Card>
            </YStack>
        </XStack>
    );
}
