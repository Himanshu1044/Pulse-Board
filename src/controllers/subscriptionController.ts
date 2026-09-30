import { Request, Response } from "express";
import { getUserPlanLimits, getUserSubscription } from "../services/subscriptionService";

export const getSubscriptionController = async (
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

        const subscription = await getUserSubscription(userId);
        const { limits } = await getUserPlanLimits(userId);

        return res.status(200).json({
            subscription,
            limits
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to get subscription"
        });
    }
};