import express from 'express';

import { getSuppliers,createSupplier} from '../controllers/supplier.js'

const router = express.Router();

router.get('/',getSuppliers);
router.post('/',createSupplier)

export default router;