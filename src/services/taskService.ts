import pool from "../config/database.js";
import { createActivityLog } from "./activityLogService";
import { emitToProject } from "../socketEmitter";
import { createNotification } from "./notificationService";
import { canCreateTask } from "./subscriptionService";

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
    const allowed = await canCreateTask(projectId);

    if (!allowed) {
        throw new Error(
            "Task limit reached for the current plan"
        );
    }
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

    if (assignedTo) {
        await createNotification(
            assignedTo,
            projectId,
            "task.assigned",
            "Task assigned",
            `You were assigned the task "${task.title}"`,
            "task",
            task.id
        );
    }

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

    emitToProject(
        projectId,
        "task.created",
        task
    );

    return task;
};

export const getProjectTasks = async (
    projectId: string,
    status?: string,
    priority?: string,
    assignedTo?: string,
    search?: string,
    page: number = 1,
    limit: number = 10
) => {
    const offset = (page - 1) * limit;

    const conditions = ["t.project_id = $1"];
    const values: unknown[] = [projectId];
    let parameterIndex = 2;

    if (status) {
        conditions.push(`t.status = $${parameterIndex}`);
        values.push(status);
        parameterIndex++;
    }

    if (priority) {
        conditions.push(`t.priority = $${parameterIndex}`);
        values.push(priority);
        parameterIndex++;
    }

    if (assignedTo) {
        conditions.push(`t.assigned_to = $${parameterIndex}`);
        values.push(assignedTo);
        parameterIndex++;
    }

    if (search) {
        conditions.push(
            `(t.title ILIKE $${parameterIndex} OR t.description ILIKE $${parameterIndex})`
        );
        values.push(`%${search}%`);
        parameterIndex++;
    }

    const whereClause = conditions.join(" AND ");

    const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total
         FROM tasks t
         WHERE ${whereClause}`,
        values
    );

    const total = countResult.rows[0].total;

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
         WHERE ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT $${parameterIndex}
         OFFSET $${parameterIndex + 1}`,
        [
            ...values,
            limit,
            offset
        ]
    );

    return {
        tasks: result.rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
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
        `SELECT id, assigned_to
     FROM tasks
     WHERE id = $1
       AND project_id = $2`,
        [taskId, projectId]
    );

    if (taskResult.rows.length === 0) {
        throw new Error("Task not found");
    }
    const previousAssignedTo = taskResult.rows[0].assigned_to;

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
         assigned_to = CASE
             WHEN $5 THEN $6
             ELSE assigned_to
         END,
         due_date = CASE
             WHEN $7 THEN $8
             ELSE due_date
         END,
         updated_at = NOW()
     WHERE id = $9
       AND project_id = $10
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
            assignedTo !== undefined,
            assignedTo ?? null,
            dueDate !== undefined,
            dueDate ?? null,
            taskId,
            projectId
        ]
    );

    const task = result.rows[0];

    if (assignedTo && assignedTo !== previousAssignedTo) {
        await createNotification(
            assignedTo,
            projectId,
            "task.assigned",
            "Task assigned",
            `You were assigned the task "${task.title}"`,
            "task",
            task.id
        );
    }

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
    emitToProject(
        projectId,
        "task.updated",
        task
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

    emitToProject(
        projectId,
        "task.deleted",
        task
    );

    return task;
};