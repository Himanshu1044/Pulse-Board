import { Router } from "express";
import {
    createPaymentOrderController,
    getUserPaymentsController,
    verifyPaymentController
} from "../controllers/paymentController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/payments/order", authMiddleware, createPaymentOrderController);
router.get("/payments", authMiddleware, getUserPaymentsController);
router.post("/payments/verify", authMiddleware, verifyPaymentController);

export default router;