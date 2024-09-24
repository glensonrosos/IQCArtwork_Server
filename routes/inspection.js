import express from 'express';

import { getInspections,createInspection,getInspectionById,editInspection,getInspectionsBySearch} from '../controllers/inspection.js'

const router = express.Router();

router.get('/',getInspections);
router.get('/search',getInspectionsBySearch);
router.get('/:id/getInspectionById',getInspectionById);
router.post('/',createInspection);
router.patch('/:id/editInspection',editInspection);

export default router;