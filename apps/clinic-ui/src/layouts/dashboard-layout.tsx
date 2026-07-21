import { useEffect } from "react";
import { Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useAppDispatch } from "@/store/hooks";
import { clearCredentials } from "@/store/auth-slice";
import { fetchProfile } from "@/lib/api";

export function DashboardLayout() {
  const matches = useMatches();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Verify the JWT token is still valid by fetching the user profile.
  // If the API returns an error (expired, revoked, server down), log out immediately.
  useEffect(() => {
    let cancelled = false;

    fetchProfile()
      .then(() => {
        // Profile fetched successfully — token is valid, nothing to do.
      })
      .catch(() => {
        if (cancelled) return;
        dispatch(clearCredentials());
        navigate({ to: "/login", replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate]);
  const title =
    [...matches]
      .reverse()
      .map((match) => (match.staticData as { title?: string } | undefined)?.title)
      .find(Boolean) ?? "Dashboard";

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider className="h-screen">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
