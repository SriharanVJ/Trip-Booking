import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@travels/app/page";

export const Route = createFileRoute("/travels/")({
  component: HomePage,
});
