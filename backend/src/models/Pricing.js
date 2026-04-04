import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  description: { type: String },
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Pricing', pricingSchema);
