import express from 'express';
import { getUserProfile, updateUserProfile, getUserBookings } from '../../controllers/userProfileController.js';

const router = express.Router();

// User Profile: Get own user profile
router.get('/users/me', getUserProfile);

// User Profile: Update own user profile
router.patch('/users/:id', updateUserProfile);

// Booking (User's view): Get user's bookings
router.get('/users/:userId/bookings', getUserBookings);

export default router;
