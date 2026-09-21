import bcrypt from 'bcrypt';
import pool from '../config/database'
import { generateVerificationCode } from '../utils/verificationCode'

const SALT_ROUNDS = 10;
const CODE_EXPIRY_MINUTES = 10;

export const createVerificationCode = async (userId: string) => {
    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);

    const expiresAt = new Date(
        Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000
    );

    await pool.query(
        `UPDATE email_verifications
        SET verified_at = NOW()
        WHERE user_id = $1
        AND verified_at IS NULL`,
        [userId]
    );

    await pool.query(
        `INSERT INTO email_verifications
        (user_id, code_hash, expires_at)
        VALUES ($1,$2,$3)`,
        [userId, codeHash, expiresAt]
    );

    return code;
}

export const verifyEmailCode = async (
  email: string,
  code: string
) => {
  const userResult = await pool.query(
    `SELECT id, email_verified
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw new Error("Invalid verification request");
  }

  const user = userResult.rows[0];

  if (user.email_verified) {
    throw new Error("Email already verified");
  }

  const verificationResult = await pool.query(
    `SELECT id, code_hash, expires_at, attempts
     FROM email_verifications
     WHERE user_id = $1
       AND verified_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id]
  );

  if (verificationResult.rows.length === 0) {
    throw new Error("Verification code not found");
  }

  const verification = verificationResult.rows[0];

  if (new Date() > new Date(verification.expires_at)) {
    throw new Error("Verification code expired");
  }

  if (verification.attempts >= 5) {
    throw new Error("Too many verification attempts");
  }

  const isValid = await bcrypt.compare(
    code,
    verification.code_hash
  );

  if (!isValid) {
    await pool.query(
      `UPDATE email_verifications
       SET attempts = attempts + 1
       WHERE id = $1`,
      [verification.id]
    );

    throw new Error("Invalid verification code");
  }

  await pool.query(
    `UPDATE email_verifications
     SET verified_at = NOW()
     WHERE id = $1`,
    [verification.id]
  );

  await pool.query(
    `UPDATE users
     SET email_verified = TRUE,
         updated_at = NOW()
     WHERE id = $1`,
    [user.id]
  );

  return {
    message: "Email verified successfully"
  };
};