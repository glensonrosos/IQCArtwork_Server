import express from 'express';

import { getBuyers} from '../controllers/buyer.js'

const router = express.Router();

router.get('/',getBuyers);

export default router;