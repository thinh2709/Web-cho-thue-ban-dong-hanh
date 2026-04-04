import express from 'express';
import bookingRoutes from './bookingRoutes.js';
import homeFavoriteRoutes from './homeFavoriteRoutes.js';
import reportPricingRoutes from './reportPricingRoutes.js';
import categoryPartnerRoutes from './categoryPartnerRoutes.js';
import companionEarningsRoutes from './companionEarningsRoutes.js';
import userProfileRoutes from './userProfileRoutes.js';

const router = express.Router();

router.use('/bookings', bookingRoutes);
router.use('/home-favorites', homeFavoriteRoutes);
router.use('/reports-pricing', reportPricingRoutes);
router.use('/categories-partners', categoryPartnerRoutes);
router.use('/companions', companionEarningsRoutes);
router.use('/users', userProfileRoutes);

export default router;
