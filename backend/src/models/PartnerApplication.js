import mongoose from 'mongoose';

const partnerApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  bio: { type: String, required: true },
  skills: { type: [String], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewNote: { type: String },
}, { timestamps: true });

export default mongoose.model('PartnerApplication', partnerApplicationSchema);
