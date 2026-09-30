import { Router } from "express";
import { getSubscriptionController } from "../controllers/subscriptionController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/subscription", authMiddleware, getSubscriptionController);

export default router;