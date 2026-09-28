import { Request, Response } from "express";
import {
    getUserNotifications,
    markNotificationAsRead,
    getUnreadNotificationCount
} from "../services/notificationService";

export const getNotificationsController = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user!.userId;

        const notifications = await getUserNotifications(
            userId
        );

        return res.status(200).json({
            notifications
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch notifications"
        });
    }
};

export const markNotificationAsReadController = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user!.userId;
        const notificationId = req.params.notificationId;

        if (typeof notificationId !== "string") {
            return res.status(400).json({
                message: "Invalid notification ID"
            });
        }

        const notification = await markNotificationAsRead(
            notificationId,
            userId
        );

        return res.status(200).json({
            notification
        });
    } catch (error) {
        console.error(error);

        return res.status(404).json({
            message: "Notification not found"
        });
    }
};

export const getUnreadNotificationCountController = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user!.userId;

        const count = await getUnreadNotificationCount(userId);

        return res.status(200).json({
            count
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch unread notification count"
        });
    }
};