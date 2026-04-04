import Booking from '../models/Booking.js';

export const createBooking = async (req, res) => {
  try {
    const { userId, companionId, date, startTime, endTime, service, totalPrice, notes, companionName } = req.body;

    // Basic slot conflict check (simplified)
    // In a real app, this should check for overlapping times for the same companion on the same date
    const existingBooking = await Booking.findOne({
      companionId,
      date,
      startTime,
      endTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Khung giờ này đã có người đặt.' });
    }

    const newBooking = new Booking({
      userId,
      companionId,
      companionName,
      date,
      startTime,
      endTime,
      service,
      totalPrice,
      notes,
      status: 'pending',
    });

    await newBooking.save();
    res.status(201).json({ message: 'Đặt lịch thành công!', booking: newBooking });
  } catch (error) {
    console.error('Error in createBooking:', error);
    res.status(500).json({ message: 'Lỗi khi đặt lịch: ' + error.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const { userId, status } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách lịch hẹn: ' + error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
    }

    res.status(200).json({ message: 'Cập nhật trạng thái thành công!', booking });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật: ' + error.message });
  }
};
