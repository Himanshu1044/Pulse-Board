import pool from "../config/database";
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const createUser = async (
    name: string,
    email: string,
    password: string
) => {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
        `INSERT INTO users (name,email,password_hash)
        VALUES ($1,$2,$3)
        RETURNING id,name,email,email_verified,created_at`,
        [name, email, passwordHash]
    )

    return result.rows[0];
};

export const loginUser = async (
    email: string,
    password: string
) => {
    const result = await pool.query(
        `SELECT id, name, email, password_hash, email_verified
         FROM users
         WHERE email = $1`,
        [email]
    )

    if (result.rowCount == 0) {
        throw new Error('Invalid email or password')
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
        throw new Error('Invalid email or password')
    }

    if (!user.email_verified) {
        throw new Error("Email not verified");
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified
    }
}

export const getCurrentUser = async (userId: string) => {
    const result = await pool.query(
        `SELECT id, name, email, email_verified, created_at
         FROM users
         WHERE id = $1`,
        [userId]
    );

    if (result.rowCount === 0){
        throw new Error('User not found');
    }

    return result.rows[0];
}