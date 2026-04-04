import { Router } from "express";
import favoritesRouter from "./favorites.js";
import homeRouter from "./home.js";

const router = Router();

router.use("/home", homeRouter);
router.use("/favorites", favoritesRouter);

export default router;
