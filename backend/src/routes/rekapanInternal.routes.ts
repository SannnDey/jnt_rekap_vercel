import { Router } from 'express';
import {
  createRekapanInternal,
  importRekapanInternal,
  getAllRekapanInternal,
  getRekapanInternalById,
  updateRekapanInternal,
  deleteRekapanInternal,
  getRekapanInternalSummary,
  exportRekapanInternal,
  exportRekapanInternalSummary,
  bulkDeleteRekapanInternal,
  bulkUpdateRekapanInternal,
  getRekapanInternalReport,
  getActivityLogs,
} from '../controllers/rekapanInternal.controller';

const router = Router();

router.get('/summary', getRekapanInternalSummary);
router.get('/export', exportRekapanInternal);
router.get('/export-summary', exportRekapanInternalSummary);
router.post('/bulk-delete', bulkDeleteRekapanInternal);
router.post('/bulk-update', bulkUpdateRekapanInternal);
router.get('/report', getRekapanInternalReport);
router.get('/logs', getActivityLogs);
router.post('/', createRekapanInternal);
router.post('/import', importRekapanInternal);
router.get('/', getAllRekapanInternal);
router.get('/:id', getRekapanInternalById);
router.put('/:id', updateRekapanInternal);
router.delete('/:id', deleteRekapanInternal);

export default router;
