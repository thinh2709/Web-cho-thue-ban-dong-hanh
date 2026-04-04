import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    birthDate: { type: String, default: "" },
    address: { type: String, default: "" },
    bio: { type: String, default: "" },
    hobbies: { type: [String], default: [] },
    gallery: { type: [String], default: [] },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
