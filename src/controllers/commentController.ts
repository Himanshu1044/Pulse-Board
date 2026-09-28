import { Request, Response } from "express";
import {
    createComment,
    getTaskComments,
    updateComment,
    deleteComment
} from "../services/commentService";
import {
    createCommentSchema,
    updateCommentSchema
} from "../validators/commentValidator";

export const createCommentController = async (
    req: Request,
    res: Response
) => {
    try {
        const taskId = req.params.taskId as string;
        const currentUserId = req.user!.userId;

        const result = createCommentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid input",
                errors: result.error.flatten().fieldErrors
            });
        }

        const comment = await createComment(
            taskId,
            currentUserId,
            result.data.content
        );

        return res.status(201).json({
            message: "Comment created successfully",
            comment
        });
    } catch (error: any) {
        if (error.message === "Task not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "You are not a member of this project") {
            return res.status(403).json({
                message: error.message
            });
        }

        if (error.message === "You do not have permission to comment") {
            return res.status(403).json({
                message: error.message
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getTaskCommentsController = async (
    req: Request,
    res: Response
) => {
    try {
        const taskId = req.params.taskId as string;
        const currentUserId = req.user!.userId;

        const comments = await getTaskComments(
            taskId,
            currentUserId
        );

        return res.status(200).json({
            comments
        });
    } catch (error: any) {
        if (error.message === "Task not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "You are not a member of this project") {
            return res.status(403).json({
                message: error.message
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const updateCommentController = async (
    req: Request,
    res: Response
) => {
    try {
        const commentId = req.params.commentId as string;
        const currentUserId = req.user!.userId;

        const result = updateCommentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid input",
                errors: result.error.flatten().fieldErrors
            });
        }

        const comment = await updateComment(
            commentId,
            currentUserId,
            result.data.content
        );

        return res.status(200).json({
            message: "Comment updated successfully",
            comment
        });
    } catch (error: any) {
        if (error.message === "Comment not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "You are not a member of this project") {
            return res.status(403).json({
                message: error.message
            });
        }

        if (error.message === "You do not have permission to edit comments") {
            return res.status(403).json({
                message: error.message
            });
        }

        if (error.message === "You can only edit your own comments") {
            return res.status(403).json({
                message: error.message
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const deleteCommentController = async (
    req: Request,
    res: Response
) => {
    try {
        const commentId = req.params.commentId as string;
        const currentUserId = req.user!.userId;

        const comment = await deleteComment(
            commentId,
            currentUserId
        );

        return res.status(200).json({
            message: "Comment deleted successfully",
            comment
        });
    } catch (error: any) {
        if (error.message === "Comment not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "You are not a member of this project") {
            return res.status(403).json({
                message: error.message
            });
        }

        if (error.message === "You do not have permission to delete comments") {
            return res.status(403).json({
                message: error.message
            });
        }

        if (error.message === "You can only delete your own comments") {
            return res.status(403).json({
                message: error.message
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};