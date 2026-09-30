import { Request, Response } from "express";
import {
    createPaymentOrder,
    getUserPayments
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