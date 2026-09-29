import pool from '../config/database';
import bcrypt from 'bcrypt';
import { generateResetToken } from '../utils/resetToken';
import emailQueue from "../queues/emailQueue";

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MINUTES = 15;

export const createPasswordResetToken = async (email: string) => {
    const userResult = await pool.query(
        ` SELECT id 
          FROM users
          WHERE email = $1
        `, [email]
    )

    if (userResult.rows.length === 0) {
        return null;
    }
    const userId = userResult.rows[0].id;
    const token = generateResetToken();

    const tokenHash = await bcrypt.hash(token, SALT_ROUNDS)

    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000)

    await pool.query(
        `UPDATE password_resets
         SET used_at = NOW()
         WHERE user_id = $1
           AND used_at IS NULL`,
        [userId]
    );

    await pool.query(
        `INSERT INTO password_resets (
            user_id,
            token_hash,
            expires_at
         )
         VALUES ($1, $2, $3)`,
        [
            userId,
            tokenHash,
            expiresAt
        ]
    );

    await emailQueue.add(
        "password-reset",
        {
            email,
            token
        }
    );

    return {
        token,
        expiresAt
    };
}

export const resetPassword = async (
    email: string,
    token: string,
    newPassword: string
) => {
    const userResult = await pool.query(
        `SELECT id
         FROM users
         WHERE email = $1`,
        [email]
    );

    if (userResult.rows.length === 0) {
        throw new Error("Invalid password reset request");
    }

    const userId = userResult.rows[0].id;

    const resetResult = await pool.query(
        `SELECT
            id,
            token_hash,
            expires_at
         FROM password_resets
         WHERE user_id = $1
           AND used_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
    );

    if (resetResult.rows.length === 0) {
        throw new Error("Invalid or expired reset token");
    }

    const reset = resetResult.rows[0];

    if (new Date() > new Date(reset.expires_at)) {
        throw new Error("Reset token expired");
    }

    const tokenMatch = await bcrypt.compare(
        token,
        reset.token_hash
    );

    if (!tokenMatch) {
        throw new Error("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(
        newPassword,
        SALT_ROUNDS
    );

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const updateResetResult = await client.query(
            `UPDATE password_resets
             SET used_at = NOW()
             WHERE id = $1
               AND used_at IS NULL`,
            [reset.id]
        );

        if (updateResetResult.rowCount === 0) {
            throw new Error("Reset token has already been used");
        }

        await client.query(
            `UPDATE users
             SET password_hash = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [passwordHash, userId]
        );

        await client.query(
            `UPDATE password_resets
             SET used_at = NOW()
             WHERE user_id = $1
               AND used_at IS NULL`,
            [userId]
        );

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    return {
        message: "Password reset successfully"
    };
};