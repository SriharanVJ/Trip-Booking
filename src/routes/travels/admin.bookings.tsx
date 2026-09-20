import { createFileRoute } from "@tanstack/react-router";
import AdminBookingsPage from "@travels/app/admin/bookings/page";

export const Route = createFileRoute("/travels/admin/bookings")({
  component: AdminBookingsPage,
});
