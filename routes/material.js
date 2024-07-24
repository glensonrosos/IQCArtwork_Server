import express from 'express';

import { getMaterials} from '../controllers/material.js'

const router = express.Router();

router.get('/',getMaterials);

export default router;