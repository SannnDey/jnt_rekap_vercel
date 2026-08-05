import { Router } from 'express';
import {
  createRekapanOutgoing,
  importRekapan,
  getAllRekapanOutgoing,
  compareRekapanResults,
  getRekapanOutgoingById,
  updateRekapanOutgoing,
  deleteRekapanOutgoing,
  getRekapanSummary,
} from '../controllers/rekapan.controller';

const router = Router();

/**
 * Rekapan Outgoing Routes
 */

// GET /api/rekapan/summary - Get summary (must be before :id route)
router.get('/summary', getRekapanSummary);

// POST /api/rekapan - Create new rekapan
router.post('/', createRekapanOutgoing);

// POST /api/rekapan/import - Bulk import rekapan rows (validated server-side)
router.post('/import', importRekapan);

// GET /api/rekapan - Get all rekapan with pagination
router.get('/', getAllRekapanOutgoing);

// GET /api/rekapan/compare - Debug endpoint to compare paginated vs all results
router.get('/compare', compareRekapanResults);

// GET /api/rekapan/:id - Get by ID
router.get('/:id', getRekapanOutgoingById);

// PUT /api/rekapan/:id - Update rekapan
router.put('/:id', updateRekapanOutgoing);

// DELETE /api/rekapan/:id - Delete rekapan
router.delete('/:id', deleteRekapanOutgoing);

export default router;
