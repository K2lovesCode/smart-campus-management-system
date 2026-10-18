import { Router } from 'express';
import { listStudents } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(protect);
router.get('/students', restrictTo('faculty'), asyncHandler(listStudents));

export default router;
