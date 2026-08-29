import { createFileRoute, redirect, isRedirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { store } from "@/store";
import { queryClient } from "@/lib/query-client";
import { fetchAllSidebarPaths, fetchMySidebarConfig } from "@/lib/api";
import { getHomeRoute, isAdminRole, findGatedModulePath } from "@/lib/roles";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: async ({ location }) => {
    const { status, user } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
    if (!isAdminRole(user?.roleName)) {
      const home = getHomeRoute(user?.roleName);
      if (home !== "/dashboard") {
        throw redirect({ to: home });
      }
    }

    // Module-level access check, re-run on every load/refresh — a page
    // reachable by URL but hidden from this role's sidebar config
    // shouldn't be reachable by typing/reloading the URL either.
    //
    // This is a UX convenience on top of server-enforced permissions, not
    // the security boundary itself — so if the sidebar-config API is
    // unreachable (deploy gap, transient outage), fail open and let the
    // route load rather than crashing the whole dashboard shell.
    if (location.pathname !== "/dashboard") {
      try {
        const [allPaths, myMenu] = await Promise.all([
          queryClient.ensureQueryData({
            queryKey: ["sidebar-config", "all-paths"],
            queryFn: fetchAllSidebarPaths,
            staleTime: 5 * 60 * 1000,
          }),
          queryClient.ensureQueryData({
            queryKey: ["sidebar-config", "my"],
            queryFn: fetchMySidebarConfig,
            staleTime: 5 * 60 * 1000,
          }),
        ]);

        const gatedPath = findGatedModulePath(
          location.pathname,
          allPaths.map((p) => p.path),
        );
        const allowed = !gatedPath || myMenu.some((m) => m.path === gatedPath);
        if (!allowed) {
          throw redirect({ to: "/dashboard" });
        }
      } catch (err) {
        if (isRedirect(err)) throw err;
        console.warn("Sidebar module-access check failed, allowing navigation:", err);
      }
    }
  },
  component: DashboardLayout,
});
