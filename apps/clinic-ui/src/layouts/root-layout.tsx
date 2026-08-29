import { Toaster } from "sonner";
import { Outlet } from "@tanstack/react-router";

export function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster richColors closeButton position="top-right" />
    </>
  );
}
