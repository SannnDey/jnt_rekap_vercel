import { Router } from 'express';
import {
  createRekapanOutgoing,
  getAllRekapanOutgoing,
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

// GET /api/rekapan - Get all rekapan with pagination
router.get('/', getAllRekapanOutgoing);

// GET /api/rekapan/:id - Get by ID
router.get('/:id', getRekapanOutgoingById);

// PUT /api/rekapan/:id - Update rekapan
router.put('/:id', updateRekapanOutgoing);

// DELETE /api/rekapan/:id - Delete rekapan
router.delete('/:id', deleteRekapanOutgoing);

export default router;
