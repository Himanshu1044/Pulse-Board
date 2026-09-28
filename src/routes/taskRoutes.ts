import express from "express";
import {
    createTaskController,
    getProjectTasksController,
    updateTaskController,
    deleteTaskController
} from "../controllers/taskController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/projects/:id/tasks", authMiddleware, createTaskController);
router.get("/projects/:id/tasks", authMiddleware, getProjectTasksController);
router.patch("/projects/:id/tasks/:taskId", authMiddleware, updateTaskController);
router.delete("/projects/:id/tasks/:taskId", authMiddleware, deleteTaskController);

export default router;