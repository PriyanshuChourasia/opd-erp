import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Globe,
  Search,
  Terminal,
} from "lucide-react";
import {
  fetchModules,
  type AppModule,
  type ModuleAction,
  type ModuleFeature,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-blue-600/10 text-blue-600 hover:bg-blue-600/10",
  POST: "bg-green-600/10 text-green-600 hover:bg-green-600/10",
  PATCH: "bg-amber-600/10 text-amber-600 hover:bg-amber-600/10",
  PUT: "bg-violet-600/10 text-violet-600 hover:bg-violet-600/10",
  DELETE: "bg-red-600/10 text-red-600 hover:bg-red-600/10",
};

type ActionRow = ModuleAction & {
  moduleName: string;
  moduleId: string;
  featureName: string;
  capabilityName: string;
};

function flattenActions(modules: AppModule[]): ActionRow[] {
  return modules.flatMap((mod) =>
    mod.features.flatMap((feature: ModuleFeature) =>
      feature.capabilities.flatMap((cap) =>
        cap.actions.map((action) => ({
          ...action,
          moduleName: mod.name,
          moduleId: mod.id,
          featureName: feature.name,
          capabilityName: cap.name,
        })),
      ),
    ),
  );
}

function ModuleHeader({
  mod,
  isExpanded,
  onToggle,
  endpointCount,
}: {
  mod: AppModule;
  isExpanded: boolean;
  onToggle: () => void;
  endpointCount: number;
}) {
  return (
    <div
      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-muted"
      >
        {isExpanded ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-none bg-primary/10">
        <Terminal className="size-4 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{mod.name}</p>
          <Badge variant="outline" className="font-mono text-[10px]">
            {mod.id}
          </Badge>
          {mod.routePrefix && (
            <Badge variant="secondary" className="font-mono text-[10px]">
              /{mod.routePrefix}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {mod.description}
        </p>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-mono">v{mod.version}</span>
        <span>
          {endpointCount} endpoint{endpointCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

function EndpointRow({
  action,
  isExpanded,
  onToggle,
}: {
  action: ActionRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <div
        className="flex items-center gap-x-4 gap-y-1.5 px-6 py-2.5 pl-16 transition-colors hover:bg-muted/30 cursor-pointer"
        onClick={onToggle}
      >
        <Badge
          variant="outline"
          className={cn(
            "w-[4.5rem] shrink-0 justify-center font-mono text-[10px]",
            METHOD_STYLES[action.method ?? ""] ?? "",
          )}
        >
          {action.method ?? "—"}
        </Badge>
        <span className="shrink-0 font-mono text-xs font-medium">
          {action.path ?? "internal"}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {action.name} — {action.description}
        </span>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {action.featureName}
        </Badge>
        {(action.request || action.response) && (
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        )}
      </div>
      {isExpanded && (action.request || action.response) && (
        <div className="grid gap-x-4 gap-y-0.5 px-6 py-2 pl-28 text-[11px] leading-relaxed md:grid-cols-[4.5rem_1fr]">
          <span className="font-medium uppercase tracking-wide text-muted-foreground/70">
            Request
          </span>
          <span className="break-words font-mono text-muted-foreground">
            {action.request ?? "—"}
          </span>
          <span className="font-medium uppercase tracking-wide text-muted-foreground/70">
            Response
          </span>
          <span className="break-words font-mono text-muted-foreground">
            {action.response ?? "—"}
          </span>
        </div>
      )}
    </div>
  );
}

export function DevelopmentApisPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: fetchModules,
  });

  const modules = useMemo(() => response?.data ?? [], [response]);

  const allActions = useMemo(() => flattenActions(modules), [modules]);

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  const filteredModules = useMemo(() => {
    const q = search.toLowerCase();
    return modules
      .map((mod) => {
        const endpoints = mod.features.flatMap((feature) =>
          feature.capabilities.flatMap((cap) =>
            cap.actions.map((action) => ({
              ...action,
              featureName: feature.name,
              capabilityName: cap.name,
            })),
          ),
        );
        const filteredEndpoints = endpoints.filter((ep) => {
          const matchesSearch =
            !q ||
            ep.name.toLowerCase().includes(q) ||
            (ep.path ?? "").toLowerCase().includes(q) ||
            ep.description.toLowerCase().includes(q) ||
            ep.featureName.toLowerCase().includes(q);
          const matchesMethod =
            !methodFilter || ep.method === methodFilter;
          return matchesSearch && matchesMethod;
        });
        return { mod, endpoints: filteredEndpoints };
      })
      .filter(
        ({ endpoints }) =>
          endpoints.length > 0 ||
          (!search && !methodFilter),
      );
  }, [modules, search, methodFilter]);

  const methodCounts = useMemo(() => {
    const counts: Record<string, number> = {
      GET: 0,
      POST: 0,
      PATCH: 0,
      PUT: 0,
      DELETE: 0,
    };
    for (const action of allActions) {
      if (action.method && action.method in counts) {
        counts[action.method] = (counts[action.method] ?? 0) + 1;
      }
    }
    return counts;
  }, [allActions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          API Endpoints
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every HTTP endpoint across all registered backend modules —{" "}
          <span className="font-mono text-foreground">
            {allActions.length}
          </span>{" "}
          total
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(
          [
            { label: "Total", value: allActions.length, icon: Globe },
            { label: "GET", value: methodCounts.GET, icon: Terminal },
            { label: "POST", value: methodCounts.POST, icon: Terminal },
            { label: "PATCH", value: methodCounts.PATCH, icon: Terminal },
            { label: "DELETE", value: methodCounts.DELETE, icon: Terminal },
          ] as const
        ).map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-none",
                  label === "Total"
                    ? "bg-primary/10"
                    : `${METHOD_STYLES[label]?.split(" ")[0] ?? "bg-muted"}`,
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    label === "Total"
                      ? "text-primary"
                      : METHOD_STYLES[label]?.split(" ")[1] ?? "text-muted-foreground",
                  )}
                />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search endpoints by name, path, description, or module..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={methodFilter === null ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setMethodFilter(null)}
            >
              All
            </Button>
            {(["GET", "POST", "PATCH", "PUT", "DELETE"] as const).map(
              (method) => (
                <Button
                  key={method}
                  size="sm"
                  variant={methodFilter === method ? "default" : "outline"}
                  className={cn(
                    "h-7 text-xs font-mono",
                    methodFilter === method && METHOD_STYLES[method],
                  )}
                  onClick={() =>
                    setMethodFilter(methodFilter === method ? null : method)
                  }
                >
                  {method}
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 min-w-4 px-1 text-[10px]"
                  >
                    {methodCounts[method]}
                  </Badge>
                </Button>
              ),
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading API registry...
            </div>
          ) : filteredModules.every(({ endpoints }) => endpoints.length === 0) &&
            (search || methodFilter) ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Terminal className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No endpoints match your filters
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredModules.map(({ mod, endpoints }) => {
                const isExpanded = expandedModuleId === mod.id;
                return (
                  <div key={mod.id}>
                    <ModuleHeader
                      mod={mod}
                      isExpanded={isExpanded}
                      endpointCount={endpoints.length}
                      onToggle={() =>
                        setExpandedModuleId(isExpanded ? null : mod.id)
                      }
                    />
                    {isExpanded && (
                      <div className="border-t bg-muted/20">
                        <div className="divide-y">
                          {endpoints.map((ep) => (
                            <EndpointRow
                              key={ep.id}
                              action={ep as ActionRow}
                              isExpanded={expandedActionId === ep.id}
                              onToggle={() =>
                                setExpandedActionId(
                                  expandedActionId === ep.id ? null : ep.id,
                                )
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
