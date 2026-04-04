import CompanionProfile from '../models/CompanionProfile.js';
import Booking from '../models/Booking.js';

// Companion Profile: Get own companion profile
export const getCompanionProfile = async (req, res) => {
  try {
    const { userId } = req.query; // Assume userId is passed as a query param for now
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    const profile = await CompanionProfile.findOne({ userId }).populate('userId', 'fullName avatar email phoneNumber');
    if (!profile) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companion profile: ' + error.message });
  }
};

// Companion Profile: Update own companion profile
export const updateCompanionProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const profile = await CompanionProfile.findOneAndUpdate({ userId }, req.body, { new: true, upsert: true });
    res.status(200).json({ message: 'Companion profile updated', profile });
  } catch (error) {
    res.status(500).json({ message: 'Error updating companion profile: ' + error.message });
  }
};

// Earnings: Get companion earnings summary
export const getCompanionEarnings = async (req, res) => {
  try {
    const { userId, from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const earnings = await Booking.aggregate([
      { $match: { companionId: userId, status: 'completed', date: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    res.status(200).json({
      totalEarnings: earnings[0] ? earnings[0].total : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companion earnings: ' + error.message });
  }
};
