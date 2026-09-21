import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8)
});

export const verifyEmailSchema = z.object({
    email:z.string().trim().toLowerCase().email(),
    code:z.string().regex(/^\d{6}$/, "Verification code must be 6 digits")
})

export const loginSchema = z.object({
    email:z.string().trim().toLowerCase().email(),
    password:z.string().min(8)
})
