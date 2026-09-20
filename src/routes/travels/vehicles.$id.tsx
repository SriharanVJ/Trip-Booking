import { createFileRoute } from "@tanstack/react-router";
import VehicleDetailsPage from "@travels/app/(booking)/vehicles/[id]/page";

export const Route = createFileRoute("/travels/vehicles/$id")({
  component: VehicleDetailsPage,
});
