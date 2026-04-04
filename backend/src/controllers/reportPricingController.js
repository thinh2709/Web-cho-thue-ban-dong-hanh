import Booking from '../models/Booking.js';
import Pricing from '../models/Pricing.js';

// Reports: Get summary of bookings and revenue
export const getReportSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const totalBookings = await Booking.countDocuments({ date: { $gte: fromDate, $lte: toDate } });
    const completedBookings = await Booking.countDocuments({ status: 'completed', date: { $gte: fromDate, $lte: toDate } });
    const totalRevenue = await Booking.aggregate([
      { $match: { status: 'completed', date: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    res.status(200).json({
      totalBookings,
      completedBookings,
      totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report summary: ' + error.message });
  }
};

// Pricing: Get all pricing packages
export const getAllPricing = async (req, res) => {
  try {
    const pricing = await Pricing.find();
    res.status(200).json(pricing);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pricing: ' + error.message });
  }
};

// Pricing: Create a new pricing package
export const createPricing = async (req, res) => {
  try {
    const pricing = new Pricing(req.body);
    await pricing.save();
    res.status(201).json({ message: 'Pricing package created', pricing });
  } catch (error) {
    res.status(500).json({ message: 'Error creating pricing package: ' + error.message });
  }
};

// Pricing: Update a pricing package
export const updatePricing = async (req, res) => {
  try {
    const { id } = req.params;
    const pricing = await Pricing.findByIdAndUpdate(id, req.body, { new: true });
    if (!pricing) {
      return res.status(404).json({ message: 'Pricing package not found' });
    }
    res.status(200).json({ message: 'Pricing package updated', pricing });
  } catch (error) {
    res.status(500).json({ message: 'Error updating pricing package: ' + error.message });
  }
};

// Pricing: Delete a pricing package
export const deletePricing = async (req, res) => {
  try {
    const { id } = req.params;
    const pricing = await Pricing.findByIdAndDelete(id);
    if (!pricing) {
      return res.status(404).json({ message: 'Pricing package not found' });
    }
    res.status(200).json({ message: 'Pricing package deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting pricing package: ' + error.message });
  }
};
