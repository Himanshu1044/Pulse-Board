import { Request, Response } from "express";
import crypto from "crypto";
import "dotenv/config";
import pool from "../config/database";
import {
    createPaymentOrder,
    getUserPayments,
    markPaymentAsPaid
} from "../services/paymentService";

export const createPaymentOrderController = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const { plan } = req.body;

        if (plan !== "pro" && plan !== "team") {
            return res.status(400).json({
                message: "Invalid subscription plan"
            });
        }

        const result = await createPaymentOrder(
            userId,
            plan
        );

        return res.status(201).json({
            order: result.order,
            payment: result.payment
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to create payment order"
        });
    }
};

export const getUserPaymentsController = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const payments = await getUserPayments(userId);

        return res.status(200).json({
            payments
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to get payment history"
        });
    }
};

// Called by the frontend right after Razorpay Checkout succeeds.
// Verifies Razorpay's signature (HMAC of "order_id|payment_id" with the key secret),
// then activates the plan. Works without the webhook, so it also works on localhost.
// The webhook stays as a backup; markPaymentAsPaid is idempotent.
export const verifyPaymentController = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const {
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature
        } = req.body ?? {};

        if (
            typeof orderId !== "string" ||
            typeof paymentId !== "string" ||
            typeof signature !== "string"
        ) {
            return res.status(400).json({
                message: "Missing payment details"
            });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET as string;

        const expected = crypto
            .createHmac("sha256", keySecret)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        const a = Buffer.from(signature);
        const b = Buffer.from(expected);

        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            return res.status(400).json({
                message: "Invalid payment signature"
            });
        }

        // The order must belong to the logged-in user
        const owned = await pool.query(
            `SELECT id
             FROM payment_transactions
             WHERE provider = 'razorpay'
               AND provider_order_id = $1
               AND user_id = $2`,
            [orderId, userId]
        );

        if (owned.rows.length === 0) {
            return res.status(404).json({
                message: "Payment order not found"
            });
        }

        const payment = await markPaymentAsPaid(
            "razorpay",
            paymentId,
            orderId,
            `verify_${paymentId}`
        );

        return res.status(200).json({
            message: "Payment verified",
            status: payment.status
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to verify payment"
        });
    }
};
