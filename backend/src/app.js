import cors from "cors";
import express from "express";

import routes from "./routes/index.js";

export default function createApp({ storage }) {
  const app = express();
  app.locals.storage = storage;

  app.use(
    cors({
      origin: "*",
    }),
  );

  app.use(express.json({ limit: "2mb" }));

  app.use((req, res, next) => {
    const headerUserId = req.header("x-user-id");
    const queryUserId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    req.actorUserId = headerUserId || queryUserId || "demo-user";
    next();
  });

  app.use(routes);

  app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  return app;
}
