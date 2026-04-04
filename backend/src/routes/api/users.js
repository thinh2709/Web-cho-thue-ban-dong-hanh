import { Router } from "express";
import { getMe, patchMe } from "../../controllers/userController.js";
import { getMyBookings } from "../../controllers/bookingController.js";

export const usersRouter = Router();

usersRouter.get("/me", getMe);
usersRouter.patch("/me", patchMe);
usersRouter.get("/me/bookings", getMyBookings);
