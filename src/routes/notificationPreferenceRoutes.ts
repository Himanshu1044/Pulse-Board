import { Router } from "express";
import {
    getNotificationPreferencesController,
    updateNotificationPreferencesController
} from "../controllers/notificationPreferenceController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/notification-preferences", authMiddleware, getNotificationPreferencesController);
router.patch("/notification-preferences", authMiddleware, updateNotificationPreferencesController);

export default router;