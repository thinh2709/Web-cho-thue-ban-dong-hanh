import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String, // Simplified for now, should be mongoose.Schema.Types.ObjectId if using User model
    required: true,
  },
  companionId: {
    type: String, // Simplified for now
    required: true,
  },
  companionName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
