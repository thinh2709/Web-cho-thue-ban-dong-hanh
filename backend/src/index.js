import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT) || 3001;

await connectDatabase();
const app = createApp();
app.listen(port, () => {
  console.log(`API lắng nghe tại http://localhost:${port}`);
});
