import { Router } from "express";
import { usersRouter } from "./users.js";
import { bookingsRouter } from "./bookings.js";

export const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/bookings", bookingsRouter);
