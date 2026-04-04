import express from 'express';
import { getReportSummary, getAllPricing, createPricing, updatePricing, deletePricing } from '../../controllers/reportPricingController.js';

const router = express.Router();

// Reports: Get summary of bookings and revenue
router.get('/reports/summary', getReportSummary);

// Pricing: Get all pricing packages
router.get('/pricing', getAllPricing);

// Pricing: Create a new pricing package
router.post('/pricing', createPricing);

// Pricing: Update a pricing package
router.patch('/pricing/:id', updatePricing);

// Pricing: Delete a pricing package
router.delete('/pricing/:id', deletePricing);

export default router;
