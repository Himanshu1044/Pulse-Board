import pool from "../config/database";

export const createActivityLog = async (
    projectId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Record<string, unknown>
) => {
    const result = await pool.query(
        `INSERT INTO activity_logs (
            project_id,
            user_id,
            action,
            entity_type,
            entity_id,
            metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            project_id,
            user_id,
            action,
            entity_type,
            entity_id,
            metadata,
            created_at`,
        [
            projectId,
            userId,
            action,
            entityType,
            entityId ?? null,
            metadata ?? null
        ]
    );

    return result.rows[0];
};

export const getProjectActivityLogs = async (
    projectId: string
) => {
    const result = await pool.query(
        `SELECT
            a.id,
            a.project_id,
            a.user_id,
            u.name AS user_name,
            u.email AS user_email,
            a.action,
            a.entity_type,
            a.entity_id,
            a.metadata,
            a.created_at
         FROM activity_logs a
         JOIN users u
           ON u.id = a.user_id
         WHERE a.project_id = $1
         ORDER BY a.created_at DESC`,
        [projectId]
    );

    return result.rows;
};