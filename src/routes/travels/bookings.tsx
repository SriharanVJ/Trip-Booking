import { createFileRoute } from "@tanstack/react-router";
import BookingsPage from "@travels/app/(booking)/bookings/page";

export const Route = createFileRoute("/travels/bookings")({
  component: BookingsPage,
});
