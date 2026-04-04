import mongoose from 'mongoose';

const partnerApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Tạm thời để false nếu chưa có hệ thống Auth hoàn chỉnh
    },
    fullName: {
      type: String,
      required: [true, 'Vui lòng nhập họ tên'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Vui lòng nhập số điện thoại'],
    },
    bio: {
      type: String,
      required: [true, 'Vui lòng nhập giới thiệu bản thân'],
    },
    skills: {
      type: [String],
      required: [true, 'Vui lòng chọn ít nhất một kỹ năng'],
    },
    experience: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewNotes: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const PartnerApplication = mongoose.model('PartnerApplication', partnerApplicationSchema);

export default PartnerApplication;
