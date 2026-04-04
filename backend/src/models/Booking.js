import mongoose from "mongoose";

const bookingStatuses = ["pending", "confirmed", "cancelled", "completed"];

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    companionId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    companionName: { type: String, default: "" },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: {
      type: String,
      enum: bookingStatuses,
      default: "pending",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, start: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
export { bookingStatuses };
