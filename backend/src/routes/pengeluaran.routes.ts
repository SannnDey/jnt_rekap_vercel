import express from 'express';
import {
  getPengeluaranList,
  createPengeluaran,
  updatePengeluaran,
  deletePengeluaran,
  getPengeluaranSummary,
} from '../controllers/pengeluaran.controller';

const router = express.Router();

router.get('/summary', getPengeluaranSummary);
router.get('/', getPengeluaranList);
router.post('/', createPengeluaran);
router.put('/:id', updatePengeluaran);
router.delete('/:id', deletePengeluaran);

export default router;
