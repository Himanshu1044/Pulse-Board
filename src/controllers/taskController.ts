import { Request, Response } from "express";
import { createTask, getProjectTasks, updateTask, deleteTask } from "../services/taskService";
import { createTaskSchema, updateTaskSchema } from "../validators/taskValidator";
import { getProjectMemberRole } from "../services/projectMemberService";
import { canCreateTask } from '../utils/projectPermissions';

export const createTaskController = async (req: Request, res: Response) => {
    try {
        const projectId = req.params.id as string;
        const currentUserId = req.user!.userId;

        const currentUserRole = await getProjectMemberRole(
            projectId,
            currentUserId
        );

        if (!currentUserRole) {
            return res.status(403).json({
                message: "You are not a member of this project"
            });
        }

        if (!canCreateTask(currentUserRole)) {
            return res.status(403).json({
                message: "You do not have permission to create tasks"
            });
        }

        const result = createTaskSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid input",
                errors: result.error.flatten().fieldErrors
            });
        }

        const { title, description, status, priority, assignedTo, dueDate } = result.data;

        const task = await createTask(
            projectId,
            title,
            description,
            status,
            priority,
            assignedTo,
            dueDate
        );
        return res.status(201).json({
            message: "Task created successfully",
            task
        });

    } catch (error: any) {
        if (error.message === "Project not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "Assigned user is not a project member") {
            return res.status(400).json({
                message: error.message
            });
        }

        if (error.message === "Tasks cannot be assigned to viewers") {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export const getProjectTasksController = async (
    req: Request,
    res: Response
) => {
    try {
        const projectId = req.params.id as string;
        const currentUserId = req.user!.userId;

        const currentUserRole = await getProjectMemberRole(
            projectId,
            currentUserId
        );

        if (!currentUserRole) {
            return res.status(403).json({
                message: "You are not a member of this project"
            });
        }

        const tasks = await getProjectTasks(projectId);

        return res.status(200).json({
            tasks
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export const updateTaskController = async (
    req: Request,
    res: Response
) => {
    try {
        const projectId = req.params.id as string;
        const taskId = req.params.taskId as string;
        const currentUserId = req.user!.userId;

        const currentUserRole = await getProjectMemberRole(
            projectId,
            currentUserId
        );

        if (!currentUserRole) {
            return res.status(403).json({
                message: "You are not a member of this project"
            });
        }

        if (!canCreateTask(currentUserRole)) {
            return res.status(403).json({
                message: "You do not have permission to update tasks"
            });
        }

        const result = updateTaskSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid input",
                errors: result.error.flatten().fieldErrors
            });
        }

        const {
            title,
            description,
            status,
            priority,
            assignedTo,
            dueDate
        } = result.data;

        const task = await updateTask(
            projectId,
            taskId,
            title,
            description,
            status,
            priority,
            assignedTo,
            dueDate
        );

        return res.status(200).json({
            message: "Task updated successfully",
            task
        });
    } catch (error: any) {
        if (error.message === "Task not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "Assigned user is not a project member") {
            return res.status(400).json({
                message: error.message
            });
        }

        if (error.message === "Tasks cannot be assigned to viewers") {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const deleteTaskController = async (
    req: Request,
    res: Response
) => {
    try {
        const projectId = req.params.id as string;
        const taskId = req.params.taskId as string;
        const currentUserId = req.user!.userId;

        const currentUserRole = await getProjectMemberRole(
            projectId,
            currentUserId
        );

        if (!currentUserRole) {
            return res.status(403).json({
                message: "You are not a member of this project"
            });
        }

        if (!canCreateTask(currentUserRole)) {
            return res.status(403).json({
                message: "You do not have permission to delete tasks"
            });
        }

        const task = await deleteTask(
            projectId,
            taskId
        );

        return res.status(200).json({
            message: "Task deleted successfully",
            task
        });
    } catch (error: any) {
        if (error.message === "Task not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};