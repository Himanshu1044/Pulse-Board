import { Request, Response } from "express";
import { getProjectActivityLogs } from "../services/activityLogService";
import { getProjectMemberRole } from "../services/projectMemberService";

export const getProjectActivityLogsController = async (
    req: Request,
    res: Response
) => {
    try {
        const projectId = req.params.id as string;
        const currentUserId = req.user!.userId;

        const role = await getProjectMemberRole(
            projectId,
            currentUserId
        );

        if (!role) {
            return res.status(403).json({
                message: "You are not a member of this project"
            });
        }

        const logs = await getProjectActivityLogs(projectId);

        return res.status(200).json({
            logs
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};