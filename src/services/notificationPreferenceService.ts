import pool from "../config/database";

export const getNotificationPreferences = async (
    userId: string
) => {
    const result = await pool.query(
        `SELECT
            id,
            user_id,
            task_assigned,
            comment_created,
            member_changes,
            email_notifications,
            deadline_reminders,
            created_at,
            updated_at
         FROM notification_preferences
         WHERE user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        const createResult = await pool.query(
            `INSERT INTO notification_preferences (
                user_id
             )
             VALUES ($1)
             RETURNING
                id,
                user_id,
                task_assigned,
                comment_created,
                member_changes,
                email_notifications,
                deadline_reminders,
                created_at,
                updated_at`,
            [userId]
        );

        return createResult.rows[0];
    }

    return result.rows[0];
};

export const updateNotificationPreferences = async (
    userId: string,
    taskAssigned?: boolean,
    commentCreated?: boolean,
    memberChanges?: boolean,
    emailNotifications?: boolean,
    deadlineReminders?: boolean
) => {
    const result = await pool.query(
        `INSERT INTO notification_preferences (
            user_id,
            task_assigned,
            comment_created,
            member_changes,
            email_notifications,
            deadline_reminders
         )
         VALUES (
            $1,
            COALESCE($2, TRUE),
            COALESCE($3, TRUE),
            COALESCE($4, TRUE),
            COALESCE($5, TRUE),
            COALESCE($6, TRUE)
         )
         ON CONFLICT (user_id)
         DO UPDATE SET
            task_assigned = COALESCE(
                $2,
                notification_preferences.task_assigned
            ),
            comment_created = COALESCE(
                $3,
                notification_preferences.comment_created
            ),
            member_changes = COALESCE(
                $4,
                notification_preferences.member_changes
            ),
            email_notifications = COALESCE(
                $5,
                notification_preferences.email_notifications
            ),
            deadline_reminders = COALESCE(
                $6,
                notification_preferences.deadline_reminders
            ),
            updated_at = NOW()
         RETURNING
            id,
            user_id,
            task_assigned,
            comment_created,
            member_changes,
            email_notifications,
            deadline_reminders,
            created_at,
            updated_at`,
        [
            userId,
            taskAssigned ?? null,
            commentCreated ?? null,
            memberChanges ?? null,
            emailNotifications ?? null,
            deadlineReminders ?? null
        ]
    );

    return result.rows[0];
};