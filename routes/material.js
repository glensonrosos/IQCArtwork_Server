import express from 'express';

import { getMaterials,createMaterial} from '../controllers/material.js'

const router = express.Router();

router.get('/',getMaterials);
router.post('/',createMaterial);

export default router;