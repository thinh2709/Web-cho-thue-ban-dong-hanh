import express from 'express';
import categoryRoutes from './category.routes.js';
import partnerRoutes from './partner.routes.js';

const router = express.Router();

router.use('/categories', categoryRoutes);
router.use('/partners', partnerRoutes);

export default router;
