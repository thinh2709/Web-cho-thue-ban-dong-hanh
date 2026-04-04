import { Router } from "express";

import {
  getMyCompanionProfile,
  getMyEarnings,
  patchMyCompanionProfile,
} from "../../controllers/companions.controller.js";

const router = Router();

router.get("/me", getMyCompanionProfile);
router.patch("/me", patchMyCompanionProfile);
router.get("/me/earnings", getMyEarnings);

export default router;

