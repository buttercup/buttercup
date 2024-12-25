import { StepProps } from "antd";

export interface AddStepProps extends StepProps {
    icon: Required<StepProps>["icon"];
    id: string;
    status: AddStepStatus;
    title: Required<StepProps>["title"];
}

export type AddStepStatus = Required<StepProps>["status"];

export enum AddVaultStatus {
    ChooseFile = "choose-file",
    ChoosingFile = "choosing-file",
    UnlockVault = "unlock-vault",
    UnlockingVault = "unlocking-vault"
}
