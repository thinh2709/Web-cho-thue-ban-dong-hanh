import "dotenv/config";

import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = process.env.PORT ? Number(process.env.PORT) : 5000;
const mongoUri = process.env.MONGODB_URI;

await connectDatabase({ mongoUri });

const app = createApp();

app.listen(port, () => {
  process.stdout.write(`Backend listening on http://localhost:${port}\n`);
});
