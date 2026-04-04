import User from '../models/User.js';
import Booking from '../models/Booking.js';

// User Profile: Get own user profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.query; // Assume userId is passed as a query param for now
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile: ' + error.message });
  }
};

// User Profile: Update own user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile: ' + error.message });
  }
};

// Booking (User's view): Get user's bookings
export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user bookings: ' + error.message });
  }
};
