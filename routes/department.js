import express from 'express';

import { getDepartments} from '../controllers/department.js'

const router = express.Router();

router.get('/',getDepartments);

export default router;