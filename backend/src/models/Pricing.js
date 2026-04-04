import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      default: 'buổi',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    maxPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    category: {
      type: String,
      enum: ['basic', 'premium'],
      default: 'basic',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Pricing', pricingSchema);
