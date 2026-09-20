import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@travels/app/admin/dashboard/page";

export const Route = createFileRoute("/travels/admin/dashboard")({
  component: AdminDashboard,
});
