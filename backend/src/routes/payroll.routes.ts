import { Router } from 'express';
import {
  getPayrollRate,
  upsertPayrollRate,
  getPayrollHistory,
  savePayrollHistory,
} from '../controllers/payroll.controller';

const router = Router();

router.get('/', getPayrollRate);
router.put('/:month', upsertPayrollRate);
router.get('/history', getPayrollHistory);
router.post('/history', savePayrollHistory);

export default router;
