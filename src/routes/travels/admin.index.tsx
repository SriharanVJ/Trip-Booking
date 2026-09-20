import { createFileRoute } from "@tanstack/react-router";
import AdminPage from "@travels/app/admin/page";

export const Route = createFileRoute("/travels/admin/")({
  component: AdminPage,
});
