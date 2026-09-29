import { z } from "zod";

export const updateNotificationPreferencesSchema = z.object({
    taskAssigned: z.boolean().optional(),
    commentCreated: z.boolean().optional(),
    memberChanges: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    deadlineReminders: z.boolean().optional()
}).refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one preference is required"
    }
);