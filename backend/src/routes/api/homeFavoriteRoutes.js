import express from 'express';
import { getFeaturedCompanions, getUserFavorites, addToFavorites, removeFromFavorites } from '../../controllers/homeFavoriteController.js';

const router = express.Router();

// Home: Get featured companions
router.get('/featured', getFeaturedCompanions);

// Favorites: Get user's favorites
router.get('/favorites', getUserFavorites);

// Favorites: Add to favorites
router.post('/favorites', addToFavorites);

// Favorites: Remove from favorites
router.delete('/favorites/:userId/:companionId', removeFromFavorites);

export default router;
