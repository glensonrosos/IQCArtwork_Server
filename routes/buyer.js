import express from 'express';

import { getBuyers,createBuyer} from '../controllers/buyer.js'

const router = express.Router();

router.get('/',getBuyers);
router.post('/',createBuyer)

export default router;