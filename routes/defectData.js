import express from 'express';

import { getDefectDatas,createDefectData} from '../controllers/defectData.js'

const router = express.Router();

router.get('/:inspectionId/:passType',getDefectDatas);
router.post('/',createDefectData);

export default router;