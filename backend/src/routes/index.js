import { Router } from "express";
import { apiRouter } from "./api/index.js";

export const rootRouter = Router();

rootRouter.use("/api", apiRouter);

rootRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});
