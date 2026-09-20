import { createFileRoute } from "@tanstack/react-router";
import RoutesPage from "@travels/app/routes/page";

export const Route = createFileRoute("/travels/routes")({
  component: RoutesPage,
});
