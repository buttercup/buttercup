import React, { createContext, ReactNode } from "react";
import { notification, NotificationArgsProps } from "antd";

type NotificationArgs = Omit<NotificationArgsProps, "type">;

interface NotificationProviderProps {
    children: ReactNode;
}

export interface INotificationContext {
    success: (args: NotificationArgs) => void;
    error: (args: NotificationArgs) => void;
    info: (args: NotificationArgs) => void;
    warning: (args: NotificationArgs) => void;
}

export const NotificationContext = createContext<
    INotificationContext | undefined
>(undefined);

export function NotificationProvider(props: NotificationProviderProps) {
    const [api, contextHolder] = notification.useNotification();

    const notificationMethods = React.useMemo<INotificationContext>(
        () => ({
            success: (args) => api.success(args),
            error: (args) => api.error(args),
            info: (args) => api.info(args),
            warning: (args) => api.warning(args)
        }),
        [api]
    );

    return (
        <NotificationContext.Provider value={notificationMethods}>
            {contextHolder}
            {props.children}
        </NotificationContext.Provider>
    );
}
