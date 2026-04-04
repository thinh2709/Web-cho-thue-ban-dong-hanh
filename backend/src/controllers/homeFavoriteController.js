import User from '../models/User.js';
import Favorite from '../models/Favorite.js';
import CompanionProfile from '../models/CompanionProfile.js';

// Home: Get featured companions
export const getFeaturedCompanions = async (req, res) => {
  try {
    const featured = await CompanionProfile.find().populate('userId', 'fullName avatar').limit(8);
    res.status(200).json(featured);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching featured companions: ' + error.message });
  }
};

// Favorites: Get user's favorites
export const getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.query; // Assume userId is passed as a query param for now
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    const favorites = await Favorite.find({ userId }).populate('companionId');
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites: ' + error.message });
  }
};

// Favorites: Add to favorites
export const addToFavorites = async (req, res) => {
  try {
    const { userId, companionId } = req.body;
    const existing = await Favorite.findOne({ userId, companionId });
    if (existing) {
      return res.status(400).json({ message: 'Companion already in favorites' });
    }
    const favorite = new Favorite({ userId, companionId });
    await favorite.save();
    res.status(201).json({ message: 'Added to favorites', favorite });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to favorites: ' + error.message });
  }
};

// Favorites: Remove from favorites
export const removeFromFavorites = async (req, res) => {
  try {
    const { userId, companionId } = req.params;
    const favorite = await Favorite.findOneAndDelete({ userId, companionId });
    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    res.status(200).json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from favorites: ' + error.message });
  }
};
