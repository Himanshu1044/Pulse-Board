import { Request, Response } from "express";
import { findUserByEmail } from "../services/userService";

export const getUserByEmail = async (
    req: Request,
    res: Response
) => {
    try {
        const email = String(req.query.email || "")
            .trim()
            .toLowerCase();

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await findUserByEmail(email);

        return res.status(200).json({
            user
        });
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            error.message === "User not found"
        ) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(500).json({
            message: "Failed to find user"
        });
    }
};