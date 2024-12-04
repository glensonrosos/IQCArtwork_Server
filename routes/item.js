import express from 'express';

import { getItems,editItem,findItems,getItemById,createMultipleItem} from '../controllers/item.js'

const router = express.Router();

router.get('/',getItems);
router.get('/:id/getItemById',getItemById);
router.post('/createMultipleItem',createMultipleItem);
router.post('/findItems',findItems);
router.patch('/:id/editItem',editItem);

export default router;     