import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { rootRouter } from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "../../frontend");

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(rootRouter);
  app.use(express.static(frontendRoot));
  return app;
}
