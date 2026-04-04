import { Router } from "express";
import { patchBooking } from "../../controllers/bookingController.js";

export const bookingsRouter = Router();

bookingsRouter.patch("/:id", patchBooking);
