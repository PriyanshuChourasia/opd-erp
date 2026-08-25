import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors closeButton position="top-right" />
    </>
  ),
});
