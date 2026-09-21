import express from 'express'
import {
    register,
    verifyEmail,
    login,
    me
} from '../controllers/authController'
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login)
router.get('/me', authMiddleware, me)

export default router;