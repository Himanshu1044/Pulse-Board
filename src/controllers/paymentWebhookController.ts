import { Request, Response } from "express";
import crypto from "crypto";
import "dotenv/config";
import {
    markPaymentAsPaid,
    markPaymentAsFailed
} from "../services/paymentService";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not defined");
}

export const handlePaymentWebhookController = async (
    req: Request,
    res: Response
) => {
    try {
        const signature = req.header("X-Razorpay-Signature");
        const eventId = req.header("X-Razorpay-Event-Id");

        if (!signature) {
            return res.status(400).json({
                message: "Missing webhook signature"
            });
        }

        const rawBody = req.body as Buffer;

        const expectedSignature = crypto
            .createHmac("sha256", WEBHOOK_SECRET)
            .update(rawBody)
            .digest("hex");

        const signatureBuffer = Buffer.from(signature);
        const expectedSignatureBuffer = Buffer.from(
            expectedSignature
        );

        const isValid =
            signatureBuffer.length ===
            expectedSignatureBuffer.length &&
            crypto.timingSafeEqual(
                signatureBuffer,
                expectedSignatureBuffer
            );

        if (!eventId) {
            return res.status(400).json({
                message: "Missing webhook event ID"
            });
        }

        if (!isValid) {
            return res.status(400).json({
                message: "Invalid webhook signature"
            });
        }

        const payload = JSON.parse(
            rawBody.toString("utf8")
        );

        console.log("Razorpay webhook:", payload.event);

        if (payload.event === "payment.captured") {
            const payment =
                payload.payload.payment.entity;

            await markPaymentAsPaid(
                "razorpay",
                payment.id,
                payment.order_id,
                eventId
            );
        }

        if (payload.event === "payment.failed") {
            const payment =
                payload.payload.payment.entity;

            if (payment.order_id) {
                await markPaymentAsFailed(
                    "razorpay",
                    payment.order_id,
                    eventId
                );
            }
        }

        return res.status(200).json({
            received: true
        });
    } catch (error) {
        console.error(
            "Razorpay webhook error:",
            error
        );

        return res.status(500).json({
            message: "Webhook processing failed"
        });
    }
};