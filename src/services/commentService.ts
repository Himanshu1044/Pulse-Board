import pool from "../config/database";
import { canComment } from "../utils/projectPermissions";

export const createComment = async (
    taskId: string,
    userId: string,
    content: string
) => {
    const taskResult = await pool.query(
        `SELECT project_id
         FROM tasks
         WHERE id = $1`,
        [taskId]
    );

    if (taskResult.rows.length === 0) {
        throw new Error("Task not found");
    }

    const projectId = taskResult.rows[0].project_id;

    const memberResult = await pool.query(
        `SELECT role
         FROM project_members
         WHERE project_id = $1
           AND user_id = $2`,
        [projectId, userId]
    );

    if (memberResult.rows.length === 0) {
        throw new Error("You are not a member of this project");
    }

    if (!canComment(memberResult.rows[0].role)) {
        throw new Error("You do not have permission to comment");
    }

    const result = await pool.query(
        `INSERT INTO comments (
            task_id,
            user_id,
            content
         )
         VALUES ($1, $2, $3)
         RETURNING
            id,
            task_id,
            user_id,
            content,
            created_at,
            updated_at`,
        [taskId, userId, content]
    );

    return result.rows[0];
};

export const getTaskComments = async (
    taskId: string,
    userId: string
) => {
    const taskResult = await pool.query(
        `SELECT project_id
         FROM tasks
         WHERE id = $1`,
        [taskId]
    );

    if (taskResult.rows.length === 0) {
        throw new Error("Task not found");
    }

    const projectId = taskResult.rows[0].project_id;

    const memberResult = await pool.query(
        `SELECT id
         FROM project_members
         WHERE project_id = $1
           AND user_id = $2`,
        [projectId, userId]
    );

    if (memberResult.rows.length === 0) {
        throw new Error("You are not a member of this project");
    }

    const result = await pool.query(
        `SELECT
            c.id,
            c.task_id,
            c.user_id,
            u.name AS user_name,
            u.email AS user_email,
            c.content,
            c.created_at,
            c.updated_at
         FROM comments c
         JOIN users u
           ON u.id = c.user_id
         WHERE c.task_id = $1
         ORDER BY c.created_at ASC`,
        [taskId]
    );

    return result.rows;
};

export const updateComment = async (
    commentId: string,
    userId: string,
    content: string
) => {
    const commentResult = await pool.query(
        `SELECT
            c.id,
            t.project_id
         FROM comments c
         JOIN tasks t
           ON t.id = c.task_id
         WHERE c.id = $1`,
        [commentId]
    );

    if (commentResult.rows.length === 0) {
        throw new Error("Comment not found");
    }

    const projectId = commentResult.rows[0].project_id;

    const memberResult = await pool.query(
        `SELECT role
         FROM project_members
         WHERE project_id = $1
           AND user_id = $2`,
        [projectId, userId]
    );

    if (memberResult.rows.length === 0) {
        throw new Error("You are not a member of this project");
    }

    if (!canComment(memberResult.rows[0].role)) {
        throw new Error("You do not have permission to edit comments");
    }

    const result = await pool.query(
        `UPDATE comments
         SET content = $1,
             updated_at = NOW()
         WHERE id = $2
           AND user_id = $3
         RETURNING
            id,
            task_id,
            user_id,
            content,
            created_at,
            updated_at`,
        [content, commentId, userId]
    );

    if (result.rows.length === 0) {
        throw new Error("You can only edit your own comments");
    }

    return result.rows[0];
};

export const deleteComment = async (
    commentId: string,
    userId: string
) => {
    const commentResult = await pool.query(
        `SELECT
            c.id,
            t.project_id
         FROM comments c
         JOIN tasks t
           ON t.id = c.task_id
         WHERE c.id = $1`,
        [commentId]
    );

    if (commentResult.rows.length === 0) {
        throw new Error("Comment not found");
    }

    const projectId = commentResult.rows[0].project_id;

    const memberResult = await pool.query(
        `SELECT role
         FROM project_members
         WHERE project_id = $1
           AND user_id = $2`,
        [projectId, userId]
    );

    if (memberResult.rows.length === 0) {
        throw new Error("You are not a member of this project");
    }

    if (!canComment(memberResult.rows[0].role)) {
        throw new Error("You do not have permission to delete comments");
    }

    const result = await pool.query(
        `DELETE FROM comments
         WHERE id = $1
           AND user_id = $2
         RETURNING
            id,
            task_id,
            user_id`,
        [commentId, userId]
    );

    if (result.rows.length === 0) {
        throw new Error("You can only delete your own comments");
    }

    return result.rows[0];
};