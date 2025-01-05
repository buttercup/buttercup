import { Flex, Modal, Spin, Typography } from "antd";
import React from "react";

interface LoadingModalProps {
    open: boolean;
    text: string;
}

export function LoadingModal(props: LoadingModalProps) {
    return (
        <Modal
            closable={false}
            open={props.open}
            footer={<></>}
        >
            <Flex
                gap="middle"
                vertical
                justify="space-between"
                align="center"
                style={{ marginTop: 16 }}
            >
                <Spin size="large" />
                <Typography.Title level={3}>{props.text}</Typography.Title>
            </Flex>
        </Modal>
    );
}
