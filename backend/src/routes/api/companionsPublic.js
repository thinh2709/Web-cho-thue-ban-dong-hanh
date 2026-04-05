import { Router } from "express";
import {
  getCompanionMe,
  patchCompanionMe,
  getCompanionEarnings,
} from "../../controllers/companionPublicController.js";

export const companionsPublicRouter = Router();

companionsPublicRouter.get("/me", getCompanionMe);
companionsPublicRouter.patch("/me", patchCompanionMe);
companionsPublicRouter.get("/me/earnings", getCompanionEarnings);
