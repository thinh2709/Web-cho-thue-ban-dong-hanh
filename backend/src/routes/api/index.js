import { Router } from 'express';
import pricingRoutes from './pricing.routes.js';
import reportsRoutes from './reports.routes.js';

const router = Router();

router.use('/pricing', pricingRoutes);
router.use('/reports', reportsRoutes);

export default router;
