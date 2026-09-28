import { Router } from "express";
import {
    createCommentController,
    getTaskCommentsController,
    updateCommentController,
    deleteCommentController
} from "../controllers/commentController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/tasks/:taskId/comments", authMiddleware, createCommentController);
router.get("/tasks/:taskId/comments", authMiddleware, getTaskCommentsController);
router.patch("/comments/:commentId", authMiddleware, updateCommentController);
router.delete("/comments/:commentId", authMiddleware, deleteCommentController);

export default router;