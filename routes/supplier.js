import express from 'express';

import { getSuppliers} from '../controllers/supplier.js'

const router = express.Router();

router.get('/',getSuppliers);

export default router;