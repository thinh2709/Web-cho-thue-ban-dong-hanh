import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT) || 3001;

await connectDatabase();
const app = createApp();
app.listen(port, "0.0.0.0", () => {
  console.log(`API & giao diện: http://localhost:${port}/`);
  console.log(`Trang chủ: http://localhost:${port}/pages/index.html`);
});
