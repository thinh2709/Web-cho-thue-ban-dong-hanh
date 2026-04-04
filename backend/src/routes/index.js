import { Router } from "express";

import apiRoutes from "./api/index.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.use("/api", apiRoutes);

export default router;
