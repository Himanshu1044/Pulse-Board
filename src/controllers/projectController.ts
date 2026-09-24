import { Request, Response } from "express";
import {
    createProject,
    getProjectsByOwner,
    getProjectById,
    updateProject,
    deleteProject
} from "../services/projectService";
import { createProjectSchema, updateProjectSchema } from "../validators/projectValidator";

export const createProjectController = async (
    req: Request,
    res: Response
) => {
    try {
        const result = createProjectSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid input",
                errors: result.error.flatten().fieldErrors
            });
        }

        const { name, description } = result.data;

        const project = await createProject(
            req.user!.userId,
            name,
            description
        );

        return res.status(201).json({
            message: "Project created successfully",
            project
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getProjectsController = async (
    req: Request,
    res: Response
) => {
    try {
        const projects = await getProjectsByOwner(
            req.user!.userId
        );

        return res.status(200).json({
            projects
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getProjectController = async (
    req: Request,
    res: Response
) => {
    try {
        const project = await getProjectById(
            req.params.id as string,
            req.user!.userId
        );

        return res.status(200).json({
            project
        });
    } catch (error: any) {
        if (error.message === "Project not found") {
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

export const updateProjectController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = updateProjectSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: result.error.flatten().fieldErrors
      });
    }

    const { name, description } = result.data;

    const project = await updateProject(
      req.params.id as string,
      req.user!.userId,
      name,
      description
    );

    return res.status(200).json({
      message: "Project updated successfully",
      project
    });
  } catch (error: any) {
    if (error.message === "Project not found") {
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

export const deleteProjectController = async (
  req: Request,
  res: Response
) => {
  try {
    await deleteProject(
      req.params.id as string,
      req.user!.userId
    );

    return res.status(200).json({
      message: "Project deleted successfully"
    });
  } catch (error: any) {
    if (error.message === "Project not found") {
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