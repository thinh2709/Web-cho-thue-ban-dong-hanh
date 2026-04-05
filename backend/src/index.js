import "dotenv/config";
import { createApp } from "./app.js";
import { createStorage } from "./storage/index.js";

const port = Number(process.env.PORT) || 3001;

const app = createApp();
app.locals.storage = createStorage();

app.listen(port, "0.0.0.0", () => {
  console.log(`API & giao diện: http://localhost:${port}/`);
  console.log(`Trang chủ: http://localhost:${port}/pages/index.html`);
});
