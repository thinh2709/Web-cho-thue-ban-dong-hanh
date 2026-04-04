import express from 'express';
import { getCompanionProfile, updateCompanionProfile, getCompanionEarnings } from '../../controllers/companionEarningsController.js';

const router = express.Router();

// Companion Profile: Get own companion profile
router.get('/companions/me', getCompanionProfile);

// Companion Profile: Update own companion profile
router.patch('/companions/me', updateCompanionProfile);

// Earnings: Get companion earnings summary
router.get('/companions/me/earnings', getCompanionEarnings);

export default router;
