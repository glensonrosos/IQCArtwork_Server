import express from 'express';

import { signIn,signUp,changePassword} from '../controllers/auth.js'

const router = express.Router();

router.post('/signin',signIn);
router.post('/signup',signUp);
router.post('/changePassword',changePassword);

export default router;