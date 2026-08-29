import { useEffect, useMemo, useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { BookOpen, ChevronDown, ChevronRight, FileText, Home, Search } from "lucide-react";
import { loadHelpContent, type HelpModuleEntry, type HelpPageEntry } from "../data/help-content";
import { MarkdownRenderer } from "./markdown-renderer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const helpRoute = getRouteApi("/help");

interface HelpSelection {
  moduleId: string;
  pageId?: string;
}

function findSelection(modules: HelpModuleEntry[], moduleParam?: string, pageParam?: string): HelpSelection {
  if (moduleParam) {
    const module = modules.find((m) => m.id === moduleParam);
    if (module) {
      if (pageParam) {
        const page = module.pages.find((p) => p.id === pageParam);
        if (page) return { moduleId: module.id, pageId: page.id };
      }
      return { moduleId: module.id };
    }
  }
  return { moduleId: modules[0]?.id ?? "" };
}

export function HelpPage() {
  const search = helpRoute.useSearch();
  const navigate = useNavigate();

  const modules = useMemo(() => loadHelpContent(), []);

  const selection = useMemo(
    () => findSelection(modules, search.module, search.page),
    [modules, search.module, search.page],
  );

  const selectedModule = modules.find((m) => m.id === selection.moduleId);
  const selectedPage = selectedModule?.pages.find((p) => p.id === selection.pageId);

  // Modules expanded in the sidebar; the active module is always expanded.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([selection.moduleId]));
  useEffect(() => {
    setExpanded((prev) => {
      if (prev.has(selection.moduleId)) return prev;
      return new Set([...prev, selection.moduleId]);
    });
  }, [selection.moduleId]);

  const [filter, setFilter] = useState("");

  const filteredModules = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return modules;
    return modules
      .map((m) => {
        const pageMatches = m.pages.filter(
          (p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q),
        );
        const moduleMatches =
          m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q);
        if (!moduleMatches && pageMatches.length === 0) return null;
        return { ...m, pages: pageMatches };
      })
      .filter((m): m is HelpModuleEntry => m !== null);
  }, [modules, filter]);

  const select = (moduleId: string, pageId?: string) => {
    navigate({
      to: "/help",
      search: { module: moduleId, page: pageId },
    });
  };

  const goHome = () => navigate({ to: "/dashboard" });

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="size-4" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">Help Simulator</h1>
          <p className="truncate text-xs text-muted-foreground">Every module & page, documented</p>
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search modules & pages…"
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={goHome}>
          <Home />
          Dashboard
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-80 shrink-0 flex-col border-r bg-background md:flex">
          <nav className="flex-1 overflow-y-auto p-3">
            {filteredModules.length === 0 && (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                No modules match “{filter}”.
              </p>
            )}
            {filteredModules.map((module) => {
              const isActive = module.id === selection.moduleId;
              const isExpanded = filter.trim() !== "" || expanded.has(module.id);
              return (
                <div key={module.id} className="mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      select(module.id);
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(module.id)) next.delete(module.id);
                        else next.add(module.id);
                        return next;
                      });
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium transition-colors hover:bg-muted",
                      isActive && "bg-muted text-foreground",
                    )}
                  >
                    {module.pages.length > 0 ? (
                      isExpanded ? (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )
                    ) : (
                      <span className="size-4 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{module.title}</span>
                    {module.pages.length > 0 && (
                      <Badge variant="secondary" className="shrink-0">
                        {module.pages.length}
                      </Badge>
                    )}
                  </button>

                  {isExpanded && module.pages.length > 0 && (
                    <div className="ml-4 border-l pl-1">
                      {module.pages.map((page: HelpPageEntry) => {
                        const pageActive = isActive && selection.pageId === page.id;
                        return (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => select(module.id, page.id)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                              pageActive && "bg-muted font-medium text-foreground",
                            )}
                          >
                            <FileText className="size-3.5 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{page.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile module picker */}
        <div className="flex w-64 shrink-0 flex-col border-r bg-background md:hidden">
          <select
            aria-label="Select module"
            className="h-10 w-full rounded-none border-b bg-transparent px-3 text-sm"
            value={selection.moduleId}
            onChange={(e) => select(e.target.value)}
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          {selectedModule && selectedModule.pages.length > 0 && (
            <select
              aria-label="Select page"
              className="h-10 w-full rounded-none border-b bg-transparent px-3 text-sm"
              value={selection.pageId ?? ""}
              onChange={(e) => select(selectedModule.id, e.target.value || undefined)}
            >
              <option value="">Module overview</option>
              {selectedModule.pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{selectedModule?.title ?? "Help"}</span>
              {selectedPage && (
                <>
                  <ChevronRight className="size-3.5" />
                  <span>{selectedPage.title}</span>
                </>
              )}
            </div>
            <Separator className="my-4" />

            {selectedPage ? (
              <MarkdownRenderer content={selectedPage.content} />
            ) : selectedModule ? (
              <MarkdownRenderer content={selectedModule.content} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No help content found.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
