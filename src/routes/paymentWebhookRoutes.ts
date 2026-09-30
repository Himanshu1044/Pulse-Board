import { Router } from "express";
import {
    handlePaymentWebhookController
} from "../controllers/paymentWebhookController";

const router = Router();

router.post("/", handlePaymentWebhookController);

export default router;