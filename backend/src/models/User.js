import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String },
  phoneNumber: { type: String },
  avatar: { type: String },
  role: { type: String, enum: ['user', 'companion', 'admin'], default: 'user' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
