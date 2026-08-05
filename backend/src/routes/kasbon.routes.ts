import { Router } from 'express';
import { getKasbonList, getKasbonSummary, createKasbon, updateKasbon, deleteKasbon } from '../controllers/kasbon.controller';

const router = Router();

// GET /api/kasbon/summary
router.get('/summary', getKasbonSummary);

// GET /api/kasbon
router.get('/', getKasbonList);

// POST /api/kasbon - create
router.post('/', createKasbon);

// PUT /api/kasbon/:id - update
router.put('/:id', updateKasbon);

// DELETE /api/kasbon/:id - delete
router.delete('/:id', deleteKasbon);

export default router;
