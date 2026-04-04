import mongoose from "mongoose";

export async function connectDatabase({ mongoUri }) {
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri);
}
