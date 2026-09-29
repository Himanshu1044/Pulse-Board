import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  code: string
) => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Verify your PulseBoard account",
    html: `
      <h2>Welcome to PulseBoard</h2>
      <p>Your verification code is:</p>
      <h1>${code}</h1>
      <p>This code expires in 10 minutes.</p>
    `
  });
};

export const sendPasswordResetEmail = async (
    email: string,
    token: string
) => {
    const resetUrl = `http://localhost:5173/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: email,
        subject: "Reset your PulseBoard password",
        html: `
            <h2>Reset your PulseBoard password</h2>
            <p>We received a request to reset your password.</p>
            <p>
                <a href="${resetUrl}">
                    Reset your password
                </a>
            </p>
            <p>This link expires in 15 minutes.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
        `
    });
};