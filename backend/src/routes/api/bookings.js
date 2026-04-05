import { Router } from "express";
import { createBooking, patchBooking } from "../../controllers/bookingController.js";

export const bookingsRouter = Router();

bookingsRouter.post("/", createBooking);
bookingsRouter.patch("/:id", patchBooking);
