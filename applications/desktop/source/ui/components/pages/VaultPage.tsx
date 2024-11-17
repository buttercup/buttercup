import React from "react";
import { Button, Group, H3, Input, ListItem, ScrollView, XStack, YGroup, YStack, XGroup, Card, H2, Label, SizableText, View, Text } from "tamagui";
import { Shapes as IconAll, FileHeart as IconFavourites, FileClock as IconRecents, NotepadText as IconNote, Hash as IconTag, Search as IconSearch } from "@tamagui/lucide-icons";

export function VaultPage() {
    return (
        <XStack width="100%" alignItems="stretch">
            <YStack maxWidth="350">
                <H3>My Vault</H3>
                <YGroup alignSelf="center" bordered>
                    <YGroup.Item>
                        <ListItem hoverTheme icon={IconAll}>
                            All Entries
                        </ListItem>
                    </YGroup.Item>
                    <YGroup.Item>
                        <ListItem hoverTheme icon={IconRecents}>
                            Recents
                        </ListItem>
                    </YGroup.Item>
                    <YGroup.Item>
                        <ListItem hoverTheme icon={IconFavourites}>
                            Favourites
                        </ListItem>
                    </YGroup.Item>
                </YGroup>
            </YStack>
            <YStack maxWidth="450">
                <Group orientation="horizontal">
                    <Input
                        flex={1}
                        placeholder="Search"
                    />
                    <Button icon={IconSearch} />
                </Group>
                <ScrollView>
                    <YGroup size="$4">
                        <YGroup.Item>
                            <ListItem
                                hoverTheme
                                icon={IconNote}
                                title="Shopping List"
                                subTitle={
                                    <XGroup alignItems="center" justifyContent="flex-start">
                                        <Button icon={IconTag} flexGrow={0} size="$1">social</Button>
                                    </XGroup>
                                }
                            />
                        </YGroup.Item>
                    </YGroup>
                </ScrollView>
            </YStack>
            <YStack>
                <H2>My Note</H2>
                <YStack padding="$2">
                    <XStack>
                        <Text width={200} fontWeight="bold">Property</Text>
                        <Text fontWeight="bold">Value</Text>
                    </XStack>
                    <XStack>
                        <Text width={200}>Username</Text>
                        <Text>perry@somewhere.com</Text>
                    </XStack>
                </YStack>
            </YStack>
        </XStack>
    );
}
