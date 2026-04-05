import mongoose from "mongoose";

const CONNECT_RETRIES = Number(process.env.MONGODB_CONNECT_RETRIES) || 15;
const CONNECT_RETRY_DELAY_MS =
  Number(process.env.MONGODB_CONNECT_RETRY_DELAY_MS) || 2000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Thiếu biến môi trường MONGODB_URI");
  }

  let lastErr;
  for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
      });
      if (attempt > 1) {
        console.log(`[database] Đã kết nối MongoDB sau ${attempt} lần thử.`);
      }
      return;
    } catch (e) {
      lastErr = e;
      await mongoose.disconnect().catch(() => {});
      if (attempt < CONNECT_RETRIES) {
        console.warn(
          `[database] Chưa kết nối được MongoDB (${attempt}/${CONNECT_RETRIES}): ${e.message}. Thử lại sau ${CONNECT_RETRY_DELAY_MS}ms…`
        );
        await sleep(CONNECT_RETRY_DELAY_MS);
      }
    }
  }
  throw lastErr;
}
