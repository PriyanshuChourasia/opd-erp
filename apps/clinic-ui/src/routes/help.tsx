import { createFileRoute, redirect } from "@tanstack/react-router";
import { HelpPage } from "@/modules/help";
import { store } from "@/store";

export const Route = createFileRoute("/help")({
  beforeLoad: () => {
    const { status } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  validateSearch: (search: Record<string, unknown>): { module?: string; page?: string } => ({
    module: typeof search.module === "string" ? search.module : undefined,
    page: typeof search.page === "string" ? search.page : undefined,
  }),
  component: HelpPage,
});
