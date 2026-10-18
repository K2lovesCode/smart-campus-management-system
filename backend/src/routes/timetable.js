import { Router } from 'express';
import {
  upsertTimetable,
  getTimetable,
  listTimetables,
} from '../controllers/timetableController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(protect);

router.post('/', restrictTo('faculty'), asyncHandler(upsertTimetable));
router.get('/', asyncHandler(listTimetables));
router.get('/me', asyncHandler(getTimetable));

export default router;
