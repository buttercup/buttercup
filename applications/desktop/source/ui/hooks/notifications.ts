import { useContext } from "react";
import {
    INotificationContext,
    NotificationContext
} from "../contexts/NotificationContext.jsx";

export function useNotification(): INotificationContext {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            "useNotification must be used within a NotificationProvider"
        );
    }
    return context;
}
