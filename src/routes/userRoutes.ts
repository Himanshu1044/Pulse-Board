import { Router } from "express";
import { getUserByEmail } from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getUserByEmail);

export default router;