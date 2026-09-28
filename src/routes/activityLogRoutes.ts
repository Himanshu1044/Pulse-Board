import { Router } from "express";
import { getProjectActivityLogsController } from "../controllers/activityLogController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/projects/:id/activity", authMiddleware, getProjectActivityLogsController);

export default router;