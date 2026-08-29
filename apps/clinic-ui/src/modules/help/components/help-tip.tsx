import { useMemo } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadHelpContent, type HelpModuleEntry, type HelpPageEntry } from "../data/help-content";
import { useHelpForCurrentRoute } from "../data/use-help-route";
import { MarkdownRenderer } from "./markdown-renderer";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Small yellow help badge that explains the current screen.
 *
 * It resolves the active route through the route -> help map and shows a
 * hover tooltip with that page/module's full help content (what it is,
 * actions & effects, events, features). Clicking the badge opens the full
 * help simulator deep-linked to the same screen.
 *
 * Renders inline (no fixed positioning) so it can be placed inside each
 * page's header; pass className to position it within the header layout.
 *
 * Never renders on the public queue TV display (`/display`), the login
 * screen (`/login`), or the auth landing page (`/`).
 */

/** Paths where the help badge must never appear (public/pre-auth screens). */
const HIDDEN_PATHS = new Set(["/", "/login", "/display"]);

export function HelpTip({ className }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentHelp = useHelpForCurrentRoute();
  const modules = useMemo(() => loadHelpContent(), []);

  const activeModule: HelpModuleEntry | undefined = currentHelp
    ? modules.find((m) => m.id === currentHelp.module)
    : undefined;
  const activePage: HelpPageEntry | undefined =
    activeModule && currentHelp?.page
      ? activeModule.pages.find((p) => p.id === currentHelp.page)
      : undefined;

  const title = activePage?.title ?? activeModule?.title ?? "Help";
  const content = activePage?.content ?? activeModule?.content ?? "";

  if (!currentHelp || HIDDEN_PATHS.has(location.pathname)) return null;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Help: ${title}`}
            onClick={() =>
              navigate({
                to: "/help",
                search: { module: currentHelp.module, page: currentHelp.page },
              })
            }
            className={cn(
              "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-yellow-400 text-yellow-950 shadow-sm transition-colors hover:bg-yellow-300",
              className,
            )}
          >
            <CircleHelp className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          className="flex max-h-[70vh] w-[min(30rem,calc(100vw-2rem))] max-w-[30rem] flex-col items-start gap-0 overflow-y-auto bg-background p-4 text-left text-foreground shadow-lg ring-1 ring-foreground/10"
        >
          <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
          <Separator className="my-2 shrink-0" />
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <p className="text-sm text-muted-foreground">Click for the full help page.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
