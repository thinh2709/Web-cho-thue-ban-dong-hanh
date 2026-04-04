import dotenv from "dotenv";

import createApp from "./app.js";
import { connectDatabase } from "./config/database.js";
import { createStorage } from "./storage/index.js";

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const mongoUri = process.env.MONGODB_URI;

const db = await connectDatabase({ mongoUri });
if (!db.connected) {
  console.warn(`MongoDB disabled: ${db.error}`);
}

const storage = createStorage({ mongoConnected: db.connected });
const app = createApp({ storage });

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
