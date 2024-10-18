import express from 'express';

import { getDefectDatas,createDefectData,checkEmptyDefect} from '../controllers/defectData.js'

const router = express.Router();

router.get('/:inspectionId/:passType',getDefectDatas);
router.post('/',createDefectData);
router.post('/checkEmptyDefect',checkEmptyDefect);




export default router;