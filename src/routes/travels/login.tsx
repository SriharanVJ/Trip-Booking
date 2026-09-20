import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "@travels/app/(auth)/login/page";

export const Route = createFileRoute("/travels/login")({
  component: LoginPage,
});
