import { Router } from "express";

import companionsRoutes from "./companions.js";

const router = Router();

router.use("/companions", companionsRoutes);

export default router;
