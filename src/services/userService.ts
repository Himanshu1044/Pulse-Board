import pool from "../config/database";

export const findUserByEmail = async (email: string) => {
    const result = await pool.query(
        `SELECT id, name, email
         FROM users
         WHERE email = $1`,
        [email]
    );

    if (result.rows.length === 0) {
        throw new Error("User not found");
    }

    return result.rows[0];
};