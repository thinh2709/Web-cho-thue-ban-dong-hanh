import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    customerName: { type: String, default: 'Khách hàng', trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    completedAt: { type: Date, default: null },
    rating: { type: Number, min: 0, max: 5, default: null },
    durationHours: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

bookingSchema.index({ status: 1, completedAt: 1 });

export default mongoose.model('Booking', bookingSchema);
