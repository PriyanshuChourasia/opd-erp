import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  ChevronDown,
  ChevronRight,
  Layers,
  Search,
  Terminal,
} from "lucide-react";
import { fetchModules, type AppModule } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function countActions(mod: AppModule): number {
  return mod.features.reduce(
    (sum, f) =>
      sum + f.capabilities.reduce((cs, c) => cs + c.actions.length, 0),
    0,
  );
}

export function DevelopmentModulesPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: fetchModules,
  });

  const modules = useMemo(() => response?.data ?? [], [response]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      modules.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.description.toLowerCase().includes(search.toLowerCase()) ||
          m.id.toLowerCase().includes(search.toLowerCase()),
      ),
    [modules, search],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Application Modules
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All registered backend modules — discovered from the module registry
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search modules by name, description, or ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading modules...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Box className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No modules found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((mod) => {
                const isExpanded = expandedId === mod.id;
                const actionCount = countActions(mod);
                return (
                  <div key={mod.id}>
                    <div className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : mod.id)
                        }
                        className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-muted"
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </button>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-none bg-primary/10">
                        <Box className="size-4 text-primary" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{mod.name}</p>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {mod.id}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {mod.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Terminal className="size-3" />v{mod.version}
                        </span>
                        <span>
                          {mod.features.length} feature
                          {mod.features.length !== 1 ? "s" : ""}
                        </span>
                        <span>
                          {actionCount} action
                          {actionCount !== 1 ? "s" : ""}
                        </span>
                        {mod.routePrefix && (
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            /{mod.routePrefix}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t bg-muted/30 px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="flex items-center gap-2 text-sm font-medium">
                            <Layers className="size-4 text-muted-foreground" />
                            Features &amp; Capabilities
                          </h4>
                        </div>
                        {mod.features.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No features registered
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {mod.features.map((feature) => (
                              <div key={feature.id}>
                                <p className="text-sm font-medium">
                                  {feature.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {feature.description}
                                </p>
                                {feature.capabilities.length > 0 && (
                                  <div className="mt-2 space-y-2 pl-4">
                                    {feature.capabilities.map((cap) => (
                                      <div key={cap.id}>
                                        <p className="text-xs font-medium text-muted-foreground">
                                          {cap.name}
                                        </p>
                                        {cap.actions.length > 0 && (
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {cap.actions.map((action) => (
                                              <Badge
                                                key={action.id}
                                                variant="outline"
                                                className="font-mono text-[10px]"
                                              >
                                                {action.method} {action.path}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {mod.dependencies && mod.dependencies.length > 0 && (
                          <>
                            <Separator className="my-3" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Dependencies
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {mod.dependencies.map((dep) => (
                                  <Badge
                                    key={dep.name}
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {dep.name}
                                    {dep.version ? ` v${dep.version}` : ""}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
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
