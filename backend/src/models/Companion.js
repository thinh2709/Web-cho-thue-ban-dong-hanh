import mongoose from "mongoose";

const companionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, default: "" },
    birthDate: { type: Date },
    phoneNumber: { type: String, default: "" },
    address: { type: String, default: "" },
    bio: { type: String, default: "" },
    hobbies: { type: [String], default: [] },
    galleryUrls: { type: [String], default: [] },
    avatarUrl: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    completedAppointments: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.models.Companion || mongoose.model("Companion", companionSchema);

