import express from 'express';

import { getAreas,createArea} from '../controllers/area.js'

const router = express.Router();

router.get('/',getAreas);
router.post('/',createArea);

export default router;