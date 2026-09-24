import express from 'express';
import {
    createProjectController,
    getProjectsController,
    getProjectController,
    updateProjectController,
    deleteProjectController
} from "../controllers/projectController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createProjectController);
router.get('/', authMiddleware, getProjectsController);
router.get("/:id", authMiddleware, getProjectController);
router.patch("/:id", authMiddleware, updateProjectController);
router.delete("/:id", authMiddleware, deleteProjectController);

export default router;