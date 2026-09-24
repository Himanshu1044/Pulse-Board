import pool from "../config/database";

export const createProject = async (
  ownerId: string,
  name: string,
  description?: string
) => {
  const result = await pool.query(
    `INSERT INTO projects (owner_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING id, owner_id, name, description, created_at, updated_at`,
    [ownerId, name, description || null]
  );

  return result.rows[0];
};

export const getProjectsByOwner = async (ownerId: string) => {
  const result = await pool.query(
    `SELECT id, owner_id, name, description, created_at, updated_at
     FROM projects
     WHERE owner_id = $1
     ORDER BY created_at DESC`,
    [ownerId]
  );

  return result.rows;
};

export const getProjectById = async (
  projectId: string,
  ownerId: string
) => {
  const result = await pool.query(
    `SELECT id, owner_id, name, description, created_at, updated_at
     FROM projects
     WHERE id = $1
       AND owner_id = $2`,
    [projectId, ownerId]
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