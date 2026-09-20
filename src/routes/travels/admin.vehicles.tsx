import { createFileRoute } from "@tanstack/react-router";
import AdminVehiclesPage from "@travels/app/admin/vehicles/page";

export const Route = createFileRoute("/travels/admin/vehicles")({
  component: AdminVehiclesPage,
});
