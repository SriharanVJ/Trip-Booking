import { createFileRoute } from "@tanstack/react-router";
import RegisterPage from "@travels/app/(auth)/register/page";

export const Route = createFileRoute("/travels/register")({
  component: RegisterPage,
});
