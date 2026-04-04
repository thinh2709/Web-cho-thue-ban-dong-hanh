import mongoose from "mongoose";

export async function connectDatabase({ mongoUri }) {
  mongoose.set("strictQuery", true);
  if (!mongoUri) {
    return { connected: false, connection: null, error: "Missing MONGODB_URI" };
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    return { connected: true, connection: mongoose.connection, error: null };
  } catch (e) {
    return { connected: false, connection: null, error: e?.message || String(e) };
  }
}
