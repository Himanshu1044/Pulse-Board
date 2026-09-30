import { Router } from "express";
import {
    createPaymentOrderController,
    getUserPaymentsController
} from "../controllers/paymentController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/payments/order", authMiddleware, createPaymentOrderController);
router.get("/payments", authMiddleware, getUserPaymentsController);

export default router;