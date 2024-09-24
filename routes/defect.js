import express from 'express';

import { getDefects,createDefect} from '../controllers/defect.js'

const router = express.Router();

router.get('/',getDefects);
router.post('/',createDefect)

export default router;