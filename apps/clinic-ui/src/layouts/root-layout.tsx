import { Toaster } from "sonner";
import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster richColors closeButton position="top-right" />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  );
}
