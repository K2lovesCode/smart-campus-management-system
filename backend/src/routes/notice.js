import { Router } from 'express';
import { createNotice, listNotices, deleteNotice } from '../controllers/noticeController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(listNotices));
router.post('/', restrictTo('faculty'), asyncHandler(createNotice));
router.delete('/:id', restrictTo('faculty'), asyncHandler(deleteNotice));

export default router;
