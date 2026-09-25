import { Request, Response } from "express";
import {
    addProjectMember,
    getProjectMemberRole,
    getProjectMembers,
    updateProjectMemberRole,
    removeProjectMember
} from "../services/projectMemberService";

export const addProjectMemberController = async (
    req: Request,
    res: Response
) => {
    try {
        const projectId = req.params.id as string;
        const currentUserId = req.user!.userId;

        const currentUserRole = await getProjectMemberRole(
            projectId,
            currentUserId
        );

        if (
            currentUserRole !== "owner" &&
            currentUserRole !== "manager"
        ) {
            return res.status(403).json({
                message: "You do not have permission to add members"
            });
        }

        const { userId, role } = req.body;

        if (
            !userId ||
            !["manager", "member", "viewer"].includes(role)
        ) {
            return res.status(400).json({
                message: "Valid userId and role are required"
            });
        }

        if (currentUserRole === "manager" && role === "manager") {
            return res.status(403).json({
                message: "Only the owner can add managers"
            });
        }

        const member = await addProjectMember(
            projectId,
            userId,
            role
        );

        return res.status(201).json({
            message: "Member added successfully",
            member
        });
    } catch (error: any) {
        if (error.message === "User not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        if (error.message === "User email is not verified") {
            return res.status(403).json({
                message: error.message
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({
                message: "User is already a member of this project"
            });
        }

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getProjectMembersController = async (
  req: Request,
  res: Response
) => {
  try {
    const projectId = req.params.id as string;
    const currentUserId = req.user!.userId;

    const currentUserRole = await getProjectMemberRole(
      projectId,
      currentUserId
    );

    if (!currentUserRole) {
      return res.status(403).json({
        message: "You are not a member of this project"
      });
    }

    const members = await getProjectMembers(projectId);

    return res.status(200).json({
      members
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const updateProjectMemberRoleController = async (
  req: Request,
  res: Response
) => {
  try {
    const projectId = req.params.id as string;
    const targetUserId = req.params.userId as string;
    const currentUserId = req.user!.userId;

    const currentUserRole = await getProjectMemberRole(
      projectId,
      currentUserId
    );

    if (currentUserRole !== "owner") {
      return res.status(403).json({
        message: "Only the project owner can change member roles"
      });
    }

    const { role } = req.body;

    if (!["manager", "member", "viewer"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        message: "You cannot change your own role"
      });
    }

    const member = await updateProjectMemberRole(
      projectId,
      targetUserId,
      role
    );

    return res.status(200).json({
      message: "Member role updated successfully",
      member
    });
  } catch (error: any) {
    if (error.message === "Project member not found") {
      return res.status(404).json({
        message: error.message
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const removeProjectMemberController = async (
  req: Request,
  res: Response
) => {
  try {
    const projectId = req.params.id as string;
    const targetUserId = req.params.userId as string;
    const currentUserId = req.user!.userId;

    const currentUserRole = await getProjectMemberRole(
      projectId,
      currentUserId
    );

    if (currentUserRole !== "owner") {
      return res.status(403).json({
        message: "Only the project owner can remove members"
      });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        message: "You cannot remove yourself from the project"
      });
    }

    const member = await removeProjectMember(
      projectId,
      targetUserId
    );

    return res.status(200).json({
      message: "Member removed successfully",
      member
    });
  } catch (error: any) {
    if (error.message === "Project member not found") {
      return res.status(404).json({
        message: error.message
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};