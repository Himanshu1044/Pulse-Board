import { Request, Response } from "express";
import {
    getNotificationPreferences,
    updateNotificationPreferences
} from "../services/notificationPreferenceService";
import {
    updateNotificationPreferencesSchema
} from "../validators/notificationPreferenceValidator";

export const getNotificationPreferencesController = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const preferences = await getNotificationPreferences(
            userId
        );

        return res.status(200).json(preferences);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to get notification preferences"
        });
    }
};

export const updateNotificationPreferencesController = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const parsed =
            updateNotificationPreferencesSchema.safeParse(
                req.body
            );

        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid notification preferences"
            });
        }

        const preferences =
            await updateNotificationPreferences(
                userId,
                parsed.data.taskAssigned,
                parsed.data.commentCreated,
                parsed.data.memberChanges,
                parsed.data.emailNotifications,
                parsed.data.deadlineReminders
            );

        return res.status(200).json(preferences);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message:
                "Failed to update notification preferences"
        });
    }
};