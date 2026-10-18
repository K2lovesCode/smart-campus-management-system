import { Router } from 'express';
import {
  markAttendance,
  getMyAttendance,
  getShortageList,
} from '../controllers/attendanceController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(protect);

router.post('/mark', restrictTo('faculty'), asyncHandler(markAttendance));
router.get('/shortage', restrictTo('faculty'), asyncHandler(getShortageList));
router.get('/me', asyncHandler(getMyAttendance));

export default router;
