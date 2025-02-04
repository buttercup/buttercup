import React, { useEffect, useState } from "react";
import { styled } from "styled-components";
import { LoadingOutlined, SafetyCertificateTwoTone } from "@ant-design/icons";
import BUTTERCUP_LOGO from "../../../../../resources/images/bcup-256.png";
import { VaultState } from "../../../../shared/types.js";

interface VaultTitleProps {
    vaultStatus: VaultState["source"];
}

const TIMER_CONCERN_DELAY = 5000;

// const COLOUR_DANGER = "#F93827";
const COLOUR_OK = "#16C47F";
const COLOUR_WORKING = "#006BFF";
const COLOUR_WARNING = "#FF9D23";

const Logo = styled.img`
    height: 44px;
    width: auto;
    user-select: none;
`;

const TitleContainer = styled.div`
    flex: 0 0 auto;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    width: 100%;
    height: 72px;
    border-bottom: 1px solid rgba(255,0,0,0.25);
`;

export function VaultTitle(props: VaultTitleProps) {
    const [iconColour, setIconColour] = useState<string>(COLOUR_OK);

    useEffect(() => {
        if (props.vaultStatus === "idle") {
            setIconColour(COLOUR_OK);
            return;
        }

        setIconColour(COLOUR_WORKING);
        const timer = setTimeout(() => {
            setIconColour(COLOUR_WARNING);
        }, TIMER_CONCERN_DELAY);

        return () => {
            clearTimeout(timer);
        };
    }, [props.vaultStatus]);

    return (
        <TitleContainer>
            <Logo src={BUTTERCUP_LOGO} />
            <div>Test</div>
            {props.vaultStatus === "idle" && (
                <SafetyCertificateTwoTone
                    style={{
                        margin: "2px",
                        fontSize: "24px",
                        opacity: 0.5
                    }}
                    twoToneColor={iconColour}
                />
            )}
            {props.vaultStatus === "saving" && (
                <LoadingOutlined
                    spin
                    style={{
                        margin: "2px",
                        fontSize: "24px",
                        color: iconColour
                        // opacity: 0.5
                    }}
                />
            )}
        </TitleContainer>
    );
}
