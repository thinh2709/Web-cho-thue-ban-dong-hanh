import mongoose from 'mongoose';

const companionProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, required: true },
  skills: { type: [String], required: true },
  hourlyRate: { type: Number, required: true },
  location: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  availability: { type: [String] }, // E.g., ['Mon', 'Tue', 'Wed']
  images: { type: [String] },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
}, { timestamps: true });

export default mongoose.model('CompanionProfile', companionProfileSchema);
