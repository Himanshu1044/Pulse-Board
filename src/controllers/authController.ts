import { Request, Response } from 'express'
import {
  createUser,
  loginUser,
  getCurrentUser
} from '../services/authService'
import {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
  forgotPasswordSchema
} from '../validators/authValidator';
import {
  createVerificationCode,
  verifyEmailCode
} from '../services/verificationService'
import emailQueue from "../queues/emailQueue";
import { generateToken } from '../utils/jwt';
import {
  createPasswordResetToken,
  resetPassword
} from '../services/passwordResetService'
import { resetPasswordSchema } from '../validators/authValidator'


export const register = async (req: Request, res: Response) => {
  try {

    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: result.error.flatten().fieldErrors
      })
    }

    const { name, email, password } = result.data;

    const user = await createUser(name, email, password);

    const verificationCode = await createVerificationCode(user.id);

    await emailQueue.add('verification-email', {
      email: user.email,
      code: verificationCode
    })

    return res.status(201).json({
      message: 'User registered successfully',
      user
    })
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Email already registered"
      });
    }
    console.error(error);

    return res.status(500).json({
      message: 'Internal server error'
    })
  }
}

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const result = verifyEmailSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: result.error.flatten().fieldErrors
      });
    }

    const { email, code } = result.data;

    const response = await verifyEmailCode(email, code);

    return res.status(200).json(response);
  } catch (error: any) {
    if (error.message === "Email already verified") {
      return res.status(400).json({
        message: error.message
      });
    }

    if (
      error.message === "Verification code expired" ||
      error.message === "Too many verification attempts" ||
      error.message === "Invalid verification code" ||
      error.message === "Verification code not found"
    ) {
      return res.status(400).json({
        message: error.message
      });
    }

    if (error.message === "Invalid verification request") {
      return res.status(400).json({
        message: error.message
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: result.error.flatten().fieldErrors
      });
    }

    const { email, password } = result.data;
    const user = await loginUser(email, password);

    const token = await generateToken(user.id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user
    });
  } catch (error: any) {
    if (error.message === "Invalid email or password") {
      return res.status(401).json({
        message: error.message
      });
    }

    if (error.message === "Email not verified") {
      return res.status(403).json({
        message: error.message
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
}

export const me = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req.user!.userId);

    return res.status(200).json({
      user
    });
  } catch (error: any) {
    if (error.message === "User not found") {
      return res.status(404).json({
        message: error.message
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid email"
      });
    }

    const result = await createPasswordResetToken(
      parsed.data.email
    );

    return res.status(200).json({
      message:
        "If the account exists, a password reset email has been sent."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to process password reset request"
    })
  }
}

export const resetPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = resetPasswordSchema.safeParse(
      req.body
    );

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid reset password request"
      });
    }

    await resetPassword(
      parsed.data.email,
      parsed.data.token,
      parsed.data.newPassword
    );

    return res.status(200).json({
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      (
        error.message ===
        "Invalid password reset request" ||
        error.message ===
        "Invalid or expired reset token" ||
        error.message ===
        "Reset token expired" ||
        error.message ===
        "Reset token has already been used"
      )
    ) {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: "Failed to reset password"
    });
  }
};