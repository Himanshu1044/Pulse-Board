import pool from "../config/database";

export const addProjectMember = async (
    projectId: string,
    userId: string,
    role: string
) => {
    const userResult = await pool.query(
        `SELECT id, email_verified
     FROM users
     WHERE id = $1`,
        [userId]
    );

    if (userResult.rows.length === 0) {
        throw new Error("User not found");
    }

    if (!userResult.rows[0].email_verified) {
        throw new Error("User email is not verified");
    }

    const result = await pool.query(
        `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, $3)
     RETURNING id, project_id, user_id, role, created_at`,
        [projectId, userId, role]
    );

    return result.rows[0];
};

export const getProjectMemberRole = async (
  projectId: string,
  userId: string
) => {
  const result = await pool.query(
    `SELECT role
     FROM project_members
     WHERE project_id = $1
       AND user_id = $2`,
    [projectId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].role;
};

export const getProjectMembers = async (
  projectId: string
) => {
  const result = await pool.query(
    `SELECT
       pm.user_id,
       u.name,
       u.email,
       pm.role,
       pm.created_at
     FROM project_members pm
     JOIN users u
       ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY
       CASE pm.role
         WHEN 'owner' THEN 1
         WHEN 'manager' THEN 2
         WHEN 'member' THEN 3
         WHEN 'viewer' THEN 4
         ELSE 5
       END,
       pm.created_at`,
    [projectId]
  );

  return result.rows;
};

export const updateProjectMemberRole = async (
  projectId: string,
  userId: string,
  role: string
) => {
  const result = await pool.query(
    `UPDATE project_members
     SET role = $1
     WHERE project_id = $2
       AND user_id = $3
     RETURNING id, project_id, user_id, role, created_at`,
    [role, projectId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error("Project member not found");
  }

  return result.rows[0];
};

export const removeProjectMember = async (
  projectId: string,
  userId: string
) => {
  const result = await pool.query(
    `DELETE FROM project_members
     WHERE project_id = $1
       AND user_id = $2
     RETURNING id, project_id, user_id, role`,
    [projectId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error("Project member not found");
  }

  return result.rows[0];
};