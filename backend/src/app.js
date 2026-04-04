import cors from "cors";
import express from "express";

import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors()
  );
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use(routes);

  app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  app.use((err, req, res, next) => {
    const status = typeof err?.status === "number" ? err.status : 500;
    const message = err?.message || "Internal server error";
    res.status(status).json({ message });
  });

  return app;
}
