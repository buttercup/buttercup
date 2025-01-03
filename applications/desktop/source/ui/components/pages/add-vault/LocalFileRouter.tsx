import {
    CheckOutlined,
    EditOutlined,
    FileProtectOutlined,
    FileTextOutlined,
    UnlockOutlined
} from "@ant-design/icons";
import { Button, Divider, Flex, Form, Input, Modal, Result, Spin, Steps, Typography } from "antd";
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useIPCCall } from "../../../hooks/ipc.js";
import { assert } from "../../../utilities/assert.js";
import { useNotification } from "../../../hooks/notifications.js";
import { AddStepProps } from "./types.js";

interface LocalFileRouterProps {}

function getSteps(): Array<AddStepProps> {
    return [
        {
            id: "choose-file",
            title: "Choose File",
            status: "wait",
            icon: <FileProtectOutlined />
        },
        {
            id: "unlock",
            title: "Unlock",
            status: "wait",
            icon: <UnlockOutlined />
        },
        {
            id: "added",
            title: "Vault Added",
            status: "wait",
            icon: <CheckOutlined />
        }
    ];
}

export function LocalFileRouter(props: LocalFileRouterProps) {
    const navigate = useNavigate();
    const notification = useNotification();

    const [steps, setSteps] = useState<Array<AddStepProps>>(getSteps);

    const currentPage = useMemo(() => {
        const errored = steps.find((item) => item.status === "error");
        if (errored) return errored.id;

        const nextWaiting = steps.find((item) => item.status === "wait");
        if (nextWaiting) return nextWaiting.id;

        const finished = [...steps]
            .reverse()
            .find((item) => item.status === "finish");
        if (finished) return finished.id;

        return steps[0]?.id;
    }, [steps]);

    const [filePath, setFilePath] = useState<string | null>(null);
    const handleExistingFileChosen = useCallback(
        (error: string | null, result: { filePath: string | null } | null) => {
            setSteps((currentSteps) => {
                const outSteps = [...currentSteps];

                const chooseStep = outSteps.find(
                    (item) => item.id === "choose-file"
                );
                assert(chooseStep, "No step found for choose-file state");

                if (error || !result) {
                    chooseStep.status = "error";
                    notification.error({
                        message: "Failed choosing vault file",
                        description: error
                    });
                } else {
                    chooseStep.status = "finish";
                    setFilePath(result.filePath);
                }

                return outSteps;
            });
        },
        [notification]
    );
    const { execute: executeChooseExisting } = useIPCCall(
        "local_file_browse_existing",
        handleExistingFileChosen
    );

    const [name, setName] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [unlocking, setUnlocking] = useState<boolean>(false);

    const handleVaultAdded = useCallback((error: string | null) => {
        setSteps((currentSteps) => {
            setUnlocking(false);

            const outSteps = [...currentSteps];
            const unlockStep = outSteps.find(
                (item) => item.id === "unlock"
            );
            assert(unlockStep, "No step found for unlock state");

            if (error !== null) {
                unlockStep.status = "error";
                notification.error({
                    message: "Failed unlocking vault",
                    description: error
                });
            } else {
                unlockStep.status = "finish";
            }

            return outSteps;
        });
    }, []);
    const { execute: executeAddVault } = useIPCCall("local_file_add_existing", handleVaultAdded);
    const handleUnlock = useCallback(() => {
        if (password.length <= 0 || !filePath) return;
        setUnlocking(true);

        executeAddVault(name, filePath, password);
    }, [executeAddVault, filePath, name, password]);

    return (
        <>
            <Steps items={steps} />
            <Flex
                gap="middle"
                justify={currentPage === "added" ? "center" : "space-between"}
                align="stretch"
                style={{ marginTop: "22px", flex: "1 1 auto" }}
            >
                {currentPage === "choose-file" && (
                    <>
                        <div
                            style={{
                                flex: 1,
                                padding: "10px 24px",
                                display: "flex",
                                justifyContent: "center",
                                flexDirection: "column"
                            }}
                        >
                            <Typography.Title level={4}>
                                Add a new or existing vault
                            </Typography.Title>
                            <Typography.Paragraph>
                                Browse to add an existing vault, or create an
                                entirely new vault file. The choice is yours.
                            </Typography.Paragraph>
                        </div>

                        <Divider type="vertical" style={{ height: "auto" }} />

                        <div
                            style={{
                                flex: 1,
                                padding: "10px 24px",
                                display: "flex",
                                justifyContent: "center",
                                flexDirection: "column"
                            }}
                        >
                            <Button size="large" icon={<EditOutlined />}>
                                Create New Vault
                            </Button>
                            <br />
                            <Button
                                size="large"
                                icon={<FileTextOutlined />}
                                onClick={() => executeChooseExisting()}
                            >
                                Open Vault File
                            </Button>
                        </div>
                    </>
                )}
                {currentPage === "unlock" && (
                    <>
                        <div
                            style={{
                                flex: 1,
                                padding: "10px 24px",
                                display: "flex",
                                justifyContent: "center",
                                flexDirection: "column"
                            }}
                        >
                            <Typography.Title level={4}>
                                Unlock Vault
                            </Typography.Title>
                            <Typography.Paragraph>
                                Enter your vault password to unlock and add it
                                to the application.
                            </Typography.Paragraph>
                        </div>

                        <Divider type="vertical" style={{ height: "auto" }} />

                        <div
                            style={{
                                flex: 1,
                                padding: "10px 24px",
                                display: "flex",
                                justifyContent: "center",
                                flexDirection: "column"
                            }}
                        >
                            <Form
                                name="unlock-vault"
                                layout="vertical"
                                variant="outlined"
                            >
                                <Form.Item
                                    label="Name"
                                    name="name"
                                    rules={[
                                        {
                                            required: true
                                        }
                                    ]}
                                >
                                    <Input type="text" value={name} onChange={evt => setName(evt.target.value)} />
                                </Form.Item>
                                <Form.Item
                                    label="Password"
                                    name="password"
                                    rules={[
                                        {
                                            required: true
                                        }
                                    ]}
                                >
                                    <Input type="password" value={password} onChange={evt => setPassword(evt.target.value)} />
                                </Form.Item>
                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        onClick={() => handleUnlock()}
                                        disabled={password.length <= 0 || name.length <= 0}
                                    >
                                        Unlock
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </>
                )}
                {currentPage === "added" && (
                    <Result
                        status="success"
                        title="Successfully added new local vault"
                        subTitle={`The local vault '${name}' was added and unlocked.`}
                        extra={[
                            <Button type="primary" onClick={() => navigate("/")}>
                                Done
                            </Button>
                        ]}
                    />
                )}
            </Flex>
            <Modal
                closable={false}
                open={unlocking}
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
                    <Typography.Title level={3}>Unlocking Vault</Typography.Title>
                </Flex>
            </Modal>
        </>
    );
}
