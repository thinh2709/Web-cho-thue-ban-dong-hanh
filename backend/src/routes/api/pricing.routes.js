import { Router } from 'express';
import {
  listPricing,
  createPricing,
  updatePricing,
  deletePricing,
} from '../../controllers/pricingController.js';
import { requireAdminApiKey } from '../../middleware/requireAdminApiKey.js';

const router = Router();

router.get('/', listPricing);
router.post('/', requireAdminApiKey, createPricing);
router.patch('/:id', requireAdminApiKey, updatePricing);
router.delete('/:id', requireAdminApiKey, deletePricing);

export default router;
