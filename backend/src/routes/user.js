import { Router } from 'express';
import { listStudents, createStudent, deleteStudent } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(protect);

router.get('/students', restrictTo('faculty'), asyncHandler(listStudents));
router.post('/students', restrictTo('faculty'), asyncHandler(createStudent));
router.delete('/students/:id', restrictTo('faculty'), asyncHandler(deleteStudent));

export default router;
