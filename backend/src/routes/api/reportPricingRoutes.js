import express from 'express';
import { getReportSummary } from '../../controllers/reportPricingController.js';

const router = express.Router();

// Reports: Get summary of bookings and revenue
router.get('/reports/summary', getReportSummary);

export default router;
