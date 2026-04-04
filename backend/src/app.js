import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import apiRouter from "./routes/api/index.js";

export default function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/api", apiRouter);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const frontendDir = path.resolve(__dirname, "..", "frontend");
  app.use(express.static(frontendDir));

  app.get("/favorites", (_req, res) => {
    res.sendFile(path.join(frontendDir, "favorites.html"));
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return app;
}
