import pool from "../config/database";
import { canCreateProject } from "./subscriptionService";

export const createProject = async (
  ownerId: string,
  name: string,
  description?: string
) => {
  const allowed = await canCreateProject(ownerId);

  if (!allowed) {
    throw new Error(
      "Project limit reached for your current plan"
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const projectResult = await client.query(
      `INSERT INTO projects (owner_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, owner_id, name, description, created_at, updated_at`,
      [ownerId, name, description || null]
    );

    const project = projectResult.rows[0];

    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [project.id, ownerId, "owner"]
    );

    await client.query("COMMIT");

    return project;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getProjectsForUser = async (userId: string) => {
  const result = await pool.query(
    `SELECT p.id, p.owner_id, p.name, p.description,
            p.created_at, p.updated_at, pm.role
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     WHERE pm.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return result.rows;
};

export const getProjectById = async (
  projectId: string,
  userId: string
) => {
  const result = await pool.query(
    `SELECT p.id, p.owner_id, p.name, p.description,
            p.created_at, p.updated_at, pm.role
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     WHERE p.id = $1
       AND pm.user_id = $2`,
    [projectId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error("Project not found");
  }

  return result.rows[0];
};

export const updateProject = async (
  projectId: string,
  ownerId: string,
  name?: string,
  description?: string
) => {
  const result = await pool.query(
    `UPDATE projects
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         updated_at = NOW()
     WHERE id = $3
       AND owner_id = $4
     RETURNING id, owner_id, name, description, created_at, updated_at`,
    [name ?? null, description ?? null, projectId, ownerId]
  );

  if (result.rows.length === 0) {
    throw new Error("Project not found");
  }

  return result.rows[0];
};

export const deleteProject = async (
  projectId: string,
  ownerId: string
) => {
  const result = await pool.query(
    `DELETE FROM projects
     WHERE id = $1
       AND owner_id = $2
     RETURNING id`,
    [projectId, ownerId]
  );

  if (result.rows.length === 0) {
    throw new Error("Project not found");
  }

  return result.rows[0];
};