import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useSelector } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { store, type RootState } from "./store";
import { queryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";
import { selectFontScale } from "./store/ui-preferences-slice";
import "./index.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/** Applies the font scale CSS variable to the document root. */
function FontScaleSync() {
  const fontScale = useSelector((state: RootState) => selectFontScale(state));
  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(fontScale));
  }, [fontScale]);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <FontScaleSync />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);
