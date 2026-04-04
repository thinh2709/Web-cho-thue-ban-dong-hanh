import { connectDatabase } from "./config/database.js";
import createApp from "./app.js";

const port = Number(process.env.PORT || 3000);

await connectDatabase();

const app = createApp();

app.listen(port, () => {
  process.stdout.write(`Backend listening on http://localhost:${port}\n`);
});
