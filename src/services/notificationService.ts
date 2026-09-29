import pool from "../config/database.js";
import { emitToUser } from "../socketEmitter";

export const createNotification = async (
    userId: string,
    projectId: string | null,
    type: string,
    title: string,
    message: string,
    entityType?: string,
    entityId?: string
) => {
    const preferenceResult = await pool.query(
        `SELECT
            task_assigned,
            comment_created,
            member_changes
         FROM notification_preferences
         WHERE user_id = $1`,
        [userId]
    );

    let preferences = preferenceResult.rows[0];

    if (!preferences) {
        const createPreferenceResult = await pool.query(
            `INSERT INTO notification_preferences (
                user_id
            )
            VALUES ($1)
            RETURNING
                task_assigned,
                comment_created,
                member_changes`,
            [userId]
        );

        preferences = createPreferenceResult.rows[0];
    }

    if (
        type === "task.assigned" &&
        !preferences.task_assigned
    ) {
        return null;
    }

    if (
        type === "comment.created" &&
        !preferences.comment_created
    ) {
        return null;
    }

    if (
        [
            "member.added",
            "member.role_updated",
            "member.removed"
        ].includes(type) &&
        !preferences.member_changes
    ) {
        return null;
    }

    const result = await pool.query(
        `INSERT INTO notifications (
            user_id,
            project_id,
            type,
            title,
            message,
            entity_type,
            entity_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            id,
            user_id,
            project_id,
            type,
            title,
            message,
            entity_type,
            entity_id,
            read_at,
            created_at`,
        [
            userId,
            projectId,
            type,
            title,
            message,
            entityType ?? null,
            entityId ?? null
        ]
    );

    const notification = result.rows[0];

    emitToUser(
        userId,
        "notification.created",
        notification
    );

    return notification;
};

export const getUserNotifications = async (
    userId: string
) => {
    const result = await pool.query(
        `SELECT
            id,
            user_id,
            project_id,
            type,
            title,
            message,
            entity_type,
            entity_id,
            read_at,
            created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );

    return result.rows;
};

export const markNotificationAsRead = async (
    notificationId: string,
    userId: string
) => {
    const result = await pool.query(
        `UPDATE notifications
         SET read_at = NOW()
         WHERE id = $1
           AND user_id = $2
           AND read_at IS NULL
         RETURNING
            id,
            user_id,
            project_id,
            type,
            title,
            message,
            entity_type,
            entity_id,
            read_at,
            created_at`,
        [notificationId, userId]
    );

    if (result.rows.length === 0) {
        throw new Error("Notification not found");
    }

    return result.rows[0];
};

export const getUnreadNotificationCount = async (
    userId: string
) => {
    const result = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM notifications
         WHERE user_id = $1
           AND read_at IS NULL`,
        [userId]
    );

    return result.rows[0].count;
};