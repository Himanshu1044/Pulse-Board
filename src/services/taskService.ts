import pool from "../config/database.js";
import { createActivityLog } from "./activityLogService";

export const createTask = async (
    projectId: string,
    userId: string,
    title: string,
    description?: string,
    status: string = "todo",
    priority: string = "medium",
    assignedTo?: string,
    dueDate?: string
) => {
    const projectResult = await pool.query(
        `SELECT id
     FROM projects
     WHERE id = $1`,
        [projectId]
    );

    if (projectResult.rows.length === 0) {
        throw new Error("Project not found");
    }

    if (assignedTo) {
        const memberResult = await pool.query(
            `SELECT role
     FROM project_members
     WHERE project_id = $1
       AND user_id = $2`,
            [projectId, assignedTo]
        );

        if (memberResult.rows.length === 0) {
            throw new Error("Assigned user is not a project member");
        }

        if (memberResult.rows[0].role === "viewer") {
            throw new Error("Tasks cannot be assigned to viewers");
        }
    }

    const result = await pool.query(
        `INSERT INTO tasks (
       project_id,
       title,
       description,
       status,
       priority,
       assigned_to,
       due_date
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING
       id,
       project_id,
       title,
       description,
       status,
       priority,
       assigned_to,
       due_date,
       created_at,
       updated_at`,
        [
            projectId,
            title,
            description || null,
            status,
            priority,
            assignedTo || null,
            dueDate || null
        ]
    );

    const task = result.rows[0];

    await createActivityLog(
        projectId,
        userId,
        "task.created",
        "task",
        task.id,
        {
            title: task.title
        }
    );

    return task;
};

export const getProjectTasks = async (
    projectId: string
) => {
    const result = await pool.query(
        `SELECT
       t.id,
       t.project_id,
       t.title,
       t.description,
       t.status,
       t.priority,
       t.assigned_to,
       u.name AS assigned_user_name,
       u.email AS assigned_user_email,
       t.due_date,
       t.created_at,
       t.updated_at
     FROM tasks t
     LEFT JOIN users u
       ON u.id = t.assigned_to
     WHERE t.project_id = $1
     ORDER BY t.created_at DESC`,
        [projectId]
    );

    return result.rows;
};

export const updateTask = async (
    projectId: string,
    userId: string,
    taskId: string,
    title?: string,
    description?: string,
    status?: string,
    priority?: string,
    assignedTo?: string | null,
    dueDate?: string | null
) => {
    const taskResult = await pool.query(
        `SELECT id
     FROM tasks
     WHERE id = $1
       AND project_id = $2`,
        [taskId, projectId]
    );

    if (taskResult.rows.length === 0) {
        throw new Error("Task not found");
    }

    if (assignedTo) {
        const memberResult = await pool.query(
            `SELECT role
     FROM project_members
     WHERE project_id = $1
       AND user_id = $2`,
            [projectId, assignedTo]
        );

        if (memberResult.rows.length === 0) {
            throw new Error("Assigned user is not a project member");
        }

        if (memberResult.rows[0].role === "viewer") {
            throw new Error("Tasks cannot be assigned to viewers");
        }
    }

    const result = await pool.query(
        `UPDATE tasks
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         priority = COALESCE($4, priority),
         assigned_to = $5,
         due_date = $6,
         updated_at = NOW()
     WHERE id = $7
       AND project_id = $8
     RETURNING
       id,
       project_id,
       title,
       description,
       status,
       priority,
       assigned_to,
       due_date,
       created_at,
       updated_at`,
        [
            title ?? null,
            description ?? null,
            status ?? null,
            priority ?? null,
            assignedTo ?? null,
            dueDate ?? null,
            taskId,
            projectId
        ]
    );

    const task = result.rows[0];

    await createActivityLog(
        projectId,
        userId,
        "task.updated",
        "task",
        task.id,
        {
            title: task.title,
            status: task.status,
            priority: task.priority
        }
    );

    return task;
}

export const deleteTask = async (
    projectId: string,
    userId: string,
    taskId: string
) => {
    const result = await pool.query(
        `DELETE FROM tasks
     WHERE id = $1
       AND project_id = $2
     RETURNING id`,
        [taskId, projectId]
    );

    if (result.rows.length === 0) {
        throw new Error("Task not found");
    }

    const task = result.rows[0];

    await createActivityLog(
        projectId,
        userId,
        "task.deleted",
        "task",
        task.id,
    );

    return task;
};