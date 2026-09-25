import express from 'express';
import {
    createProjectController,
    getProjectsController,
    getProjectController,
    updateProjectController,
    deleteProjectController,
} from "../controllers/projectController";
import {
    addProjectMemberController,
    getProjectMembersController,
    updateProjectMemberRoleController,
    removeProjectMemberController
} from "../controllers/projectMemberController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, createProjectController);
router.get('/', authMiddleware, getProjectsController);
router.get("/:id", authMiddleware, getProjectController);
router.patch("/:id", authMiddleware, updateProjectController);
router.delete("/:id", authMiddleware, deleteProjectController);

router.post("/:id/members", authMiddleware, addProjectMemberController);
router.get("/:id/members", authMiddleware, getProjectMembersController);
router.patch("/:id/members/:userId", authMiddleware, updateProjectMemberRoleController);
router.delete("/:id/members/:userId", authMiddleware, removeProjectMemberController);

export default router;