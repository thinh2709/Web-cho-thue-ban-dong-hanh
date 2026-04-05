import { Router } from "express";
import { usersRouter } from "./users.js";
import { bookingsRouter } from "./bookings.js";
import homeRouter from "./home.js";
import favoritesRouter from "./favorites.js";
import { companionsPublicRouter } from "./companionsPublic.js";
import reportPricingRouter from "./reportPricingRoutes.js";
import pricingRouter from "./pricing.routes.js";

export const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/bookings", bookingsRouter);
apiRouter.use("/home", homeRouter);
apiRouter.use("/favorites", favoritesRouter);
apiRouter.use("/companions", companionsPublicRouter);
apiRouter.use("/", reportPricingRouter);
apiRouter.use("/pricing", pricingRouter);
