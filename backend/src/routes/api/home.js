import { Router } from "express";
import { companions } from "../../data/companions.js";

const router = Router();

router.get("/featured", (_req, res) => {
  res.status(200).json({ companions });
});

export default router;
