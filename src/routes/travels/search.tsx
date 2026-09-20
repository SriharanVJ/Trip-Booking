import { createFileRoute } from "@tanstack/react-router";
import SearchPage from "@travels/app/(booking)/search/page";

export const Route = createFileRoute("/travels/search")({
  component: SearchPage,
});
