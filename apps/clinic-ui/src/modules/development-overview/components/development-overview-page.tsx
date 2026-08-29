import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Cpu,
  FileCode,
  GitBranch,
  Layers,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import { fetchModules, type AppModule } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function countActions(mod: AppModule): number {
  return mod.features.reduce(
    (sum, f) =>
      sum + f.capabilities.reduce((cs, c) => cs + c.actions.length, 0),
    0,
  );
}

export function DevelopmentOverviewPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: fetchModules,
  });

  const modules = useMemo(() => response?.data ?? [], [response]);

  const totalActions = useMemo(
    () => modules.reduce((sum, m) => sum + countActions(m), 0),
    [modules],
  );

  const totalFeatures = useMemo(
    () => modules.reduce((sum, m) => sum + m.features.length, 0),
    [modules],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Developer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            System modules, features, and API surface
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Modules", value: String(modules.length), icon: Box },
          { label: "Features", value: String(totalFeatures), icon: Zap },
          { label: "API Actions", value: String(totalActions), icon: Terminal },
          {
            label: "Health",
            value: isLoading ? "..." : "OK",
            icon: ShieldCheck,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-none bg-primary/10">
                <Icon className="size-5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Box className="size-4" />
              Application Modules
            </CardTitle>
            <CardDescription>
              All registered modules from the backend registry
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Loading modules...
              </div>
            ) : (
              <div className="divide-y">
                {modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between px-6 py-3 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Layers className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{mod.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-mono">v{mod.version}</span>
                      <span>
                        {mod.features.reduce(
                          (s, f) => s + f.capabilities.reduce((cs, c) => cs + c.actions.length, 0),
                          0,
                        )}{" "}
                        actions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Navigation shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Box, label: "Application Modules", to: "/developer/modules" },
              { icon: Zap, label: "Application Features", to: "/developer/features" },
              { icon: ShieldCheck, label: "System Health", to: "/developer/modules" },
              { icon: FileCode, label: "API Documentation", to: "/developer/modules" },
            ].map(({ icon: Icon, label, to }) => (
              <Button
                key={label}
                variant="outline"
                className="w-full justify-start gap-3"
                asChild
              >
                <Link to={to}>
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4" />
              System Overview
            </CardTitle>
            <CardDescription>Backend service status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API Status</span>
              <Badge
                variant="default"
                className="bg-green-600/10 text-green-600 hover:bg-green-600/10"
              >
                {isLoading ? "Checking..." : "Healthy"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Modules Registered</span>
              <span className="font-mono text-xs">{modules.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total API Actions</span>
              <span className="font-mono text-xs">{totalActions}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Backend Prefix</span>
              <span className="font-mono text-xs">/api</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="size-4" />
              Module Dependencies
            </CardTitle>
            <CardDescription>Cross-module dependency graph</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {modules
                .filter((m) => m.dependencies && m.dependencies.length > 0)
                .map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between px-6 py-3 text-sm"
                  >
                    <span className="font-medium">{mod.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {mod.dependencies!.map((d) => d.name).join(", ")}
                    </span>
                  </div>
                ))}
              {modules.every((m) => !m.dependencies || m.dependencies.length === 0) && (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  No cross-module dependencies
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
