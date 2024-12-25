import React, { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { rings } from "@dicebear/collection";

export interface VaultIconProps {
    size: number;
    vaultID: string;
}

export function VaultIcon(props: VaultIconProps) {
    const iconSVG = useMemo(
        () =>
            createAvatar(rings, {
                backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
                backgroundType: ["gradientLinear", "solid"],
                randomizeIds: true,
                radius: 20,
                ringColor: ["4db6ac", "4dd0e1", "4fc3f7"],
                scale: 85,
                seed: props.vaultID,
                size: props.size
            }),
        [props.vaultID]
    );
    return <div dangerouslySetInnerHTML={{ __html: iconSVG }} />;
}
