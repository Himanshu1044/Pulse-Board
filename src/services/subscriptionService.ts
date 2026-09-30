import pool from "../config/database";
import {
    subscriptionPlans,
    SubscriptionPlan
} from "../config/subscriptionPlans";

export const createFreeSubscription = async (
    userId: string
) => {
    const result = await pool.query(
        `INSERT INTO subscriptions (
            user_id,
            plan,
            status
         )
         VALUES ($1, 'free', 'active')
         ON CONFLICT (user_id) DO NOTHING
         RETURNING
            id,
            user_id,
            plan,
            status,
            current_period_start,
            current_period_end,
            created_at,
            updated_at`,
        [userId]
    );

    if (result.rows.length > 0) {
        return result.rows[0];
    }

    const existingResult = await pool.query(
        `SELECT
            id,
            user_id,
            plan,
            status,
            current_period_start,
            current_period_end,
            created_at,
            updated_at
         FROM subscriptions
         WHERE user_id = $1`,
        [userId]
    );

    return existingResult.rows[0];
};

export const getUserSubscription = async (
    userId: string
) => {
    const result = await pool.query(
        `SELECT
            id,
            user_id,
            plan,
            status,
            current_period_start,
            current_period_end,
            created_at,
            updated_at
         FROM subscriptions
         WHERE user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        return createFreeSubscription(userId);
    }

    return result.rows[0];
};

export const getUserPlanLimits = async (
    userId: string
) => {
    const subscription = await getUserSubscription(userId);

    const plan = subscription.plan as SubscriptionPlan;

    return {
        plan,
        limits: subscriptionPlans[plan]
    };
};

export const canCreateProject = async (
    userId: string
) => {
    const { limits } = await getUserPlanLimits(userId);

    const result = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM projects
         WHERE owner_id = $1`,
        [userId]
    );

    const projectCount = result.rows[0].count;

    return projectCount < limits.maxProjects;
};

export const canAddProjectMember = async (
    projectId: string
) => {
    const projectResult = await pool.query(
        `SELECT owner_id
         FROM projects
         WHERE id = $1`,
        [projectId]
    );

    if (projectResult.rows.length === 0) {
        throw new Error("Project not found");
    }

    const ownerId = projectResult.rows[0].owner_id;

    const { limits } = await getUserPlanLimits(ownerId);

    const result = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM project_members
         WHERE project_id = $1`,
        [projectId]
    );

    const memberCount = result.rows[0].count;

    return memberCount < limits.maxMembersPerProject;
};

export const canCreateTask = async (
    projectId: string
) => {
    const projectResult = await pool.query(
        `SELECT owner_id
         FROM projects
         WHERE id = $1`,
        [projectId]
    );

    if (projectResult.rows.length === 0) {
        throw new Error("Project not found");
    }

    const ownerId = projectResult.rows[0].owner_id;

    const { limits } = await getUserPlanLimits(ownerId);

    const result = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM tasks
         WHERE project_id = $1`,
        [projectId]
    );

    const taskCount = result.rows[0].count;

    return taskCount < limits.maxTasksPerProject;
};

export const updateSubscriptionPlan = async (
    userId: string,
    plan: SubscriptionPlan
) => {
    const result = await pool.query(
        `UPDATE subscriptions
         SET plan = $1,
             status = 'active',
             updated_at = NOW()
         WHERE user_id = $2
         RETURNING
            id,
            user_id,
            plan,
            status,
            current_period_start,
            current_period_end,
            created_at,
            updated_at`,
        [plan, userId]
    );

    if (result.rows.length === 0) {
        throw new Error("Subscription not found");
    }

    return result.rows[0];
};