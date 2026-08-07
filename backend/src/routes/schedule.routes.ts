import { Router } from 'express';
import {
  createAttendance,
  createEmployee,
  deleteAttendance,
  getAttendanceById,
  getAttendances,
  getEmployees,
  getScheduleSummary,
  updateAttendance,
} from '../controllers/schedule.controller';

const router = Router();

router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.get('/attendances', getAttendances);
router.get('/attendances/:id', getAttendanceById);
router.post('/attendances', createAttendance);
router.put('/attendances/:id', updateAttendance);
router.delete('/attendances/:id', deleteAttendance);
router.get('/summary', getScheduleSummary);

export default router;
