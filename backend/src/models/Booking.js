import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    companionId: { type: mongoose.Schema.Types.ObjectId, ref: "Companion", required: true, index: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    amount: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

