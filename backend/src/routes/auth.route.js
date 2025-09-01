import Router from 'express';
import {googleAuth, loginUser, registerUser, LogOut, getCurrentUser} from '../controllers/auth.js';
import {VerifyToken} from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/google-auth', googleAuth);
router.post('/login-user', loginUser);
router.post('/register-user', registerUser);
router.get('/logout-user', VerifyToken, LogOut);
router.get('/get-current-user', VerifyToken, getCurrentUser);

export default router;