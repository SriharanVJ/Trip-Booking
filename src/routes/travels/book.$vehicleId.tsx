import { createFileRoute } from "@tanstack/react-router";
import BookingPage from "@travels/app/(booking)/book/[vehicleId]/page";

export const Route = createFileRoute("/travels/book/$vehicleId")({
  component: BookingPage,
});
