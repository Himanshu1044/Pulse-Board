import { Router } from "express";
import {
    getNotificationsController,
    markNotificationAsReadController,
    getUnreadNotificationCountController
} from "../controllers/notificationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/notifications", authMiddleware, getNotificationsController);
router.get("/notifications/unread-count", authMiddleware, getUnreadNotificationCountController);
router.patch("/notifications/:notificationId/read", authMiddleware, markNotificationAsReadController);

export default router;