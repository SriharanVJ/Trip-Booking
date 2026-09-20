import { createFileRoute } from "@tanstack/react-router";
import VehiclesPage from "@travels/app/(booking)/vehicles/page";

export const Route = createFileRoute("/travels/vehicles/")({
  component: VehiclesPage,
});
