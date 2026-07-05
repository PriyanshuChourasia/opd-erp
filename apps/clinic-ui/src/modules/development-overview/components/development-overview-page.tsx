import { Link } from "@tanstack/react-router";
import { Box, Cpu, FileCode, GitBranch, Layers, ShieldCheck, Terminal, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const moduleStats = [
  { label: "Total Modules", value: "8", icon: Box },
  { label: "Active Features", value: "24", icon: Zap },
  { label: "API Endpoints", value: "47", icon: Terminal },
  { label: "Last Deployed", value: "2h ago", icon: GitBranch },
];

const modules = [
  { name: "Auth & RBAC", status: "stable", version: "1.2.0", endpoints: 6 },
  { name: "Patient Management", status: "stable", version: "2.0.1", endpoints: 8 },
  { name: "Appointments", status: "stable", version: "1.5.3", endpoints: 5 },
  { name: "Prescriptions", status: "beta", version: "0.9.0", endpoints: 4 },
  { name: "Billing & POS", status: "stable", version: "1.1.0", endpoints: 7 },
  { name: "Medicine Catalog", status: "stable", version: "1.0.0", endpoints: 3 },
  { name: "Queue Management", status: "stable", version: "1.3.0", endpoints: 4 },
  { name: "Dispensing", status: "beta", version: "0.8.0", endpoints: 3 },
];

const statusColor: Record<string, "default" | "secondary" | "outline"> = { stable: "default", beta: "secondary", dev: "outline" };

export function DevelopmentOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Development</h1><p className="mt-1 text-sm text-muted-foreground">Manage application modules, features, and system configuration</p></div>
        <Button variant="outline"><GitBranch className="mr-2 size-4" />Deploy</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {moduleStats.map(({ label, value, icon: Icon }) => (
          <Card key={label}><CardContent className="flex items-center gap-4 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-none bg-primary/10"><Icon className="size-5 text-primary" /></span>
            <div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-semibold">{value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Box className="size-4" />Application Modules</CardTitle><CardDescription>All registered modules in the system</CardDescription></CardHeader>
          <CardContent className="p-0"><div className="divide-y">
            {modules.map((mod) => (
              <div key={mod.name} className="flex items-center justify-between px-6 py-3 text-sm hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0"><Layers className="size-4 shrink-0 text-muted-foreground" /><span className="font-medium">{mod.name}</span><Badge variant={statusColor[mod.status] ?? "outline"}>{mod.status}</Badge></div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground"><span>v{mod.version}</span><span>{mod.endpoints} endpoints</span></div>
              </div>
            ))}
          </div></CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base">Quick Actions</CardTitle><CardDescription>Development tools and management</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {[{ icon: Box, label: "Application Modules", to: "/development/modules" }, { icon: Zap, label: "Application Features", to: "/development/features" },
              { icon: ShieldCheck, label: "System Health Check", to: "/development/modules" }, { icon: FileCode, label: "API Documentation", to: "/development/modules" },
              { icon: GitBranch, label: "Deployment History", to: "/development/modules" },
            ].map(({ icon: Icon, label, to }) => (
              <Button key={label} variant="outline" className="w-full justify-start gap-3" asChild><Link to={to}><Icon className="size-4 text-muted-foreground" />{label}</Link></Button>
            ))}
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GitBranch className="size-4" />Recent Deployments</CardTitle><CardDescription>Latest changes shipped to production</CardDescription></CardHeader>
          <CardContent><ul className="space-y-3">
            {[{ version: "v2.1.0", desc: "Billing module — tax calculation fix", time: "2 hours ago" },
              { version: "v2.0.3", desc: "Patient search — performance improvements", time: "1 day ago" },
              { version: "v2.0.2", desc: "Queue polling — reduced to 10s interval", time: "3 days ago" },
              { version: "v2.0.1", desc: "Auth — refresh token rotation", time: "5 days ago" },
              { version: "v2.0.0", desc: "Major release — new prescription module", time: "1 week ago" },
            ].map(({ version, desc, time }) => (
              <li key={version} className="flex items-start justify-between text-sm"><div className="min-w-0"><span className="font-mono text-xs font-medium text-primary">{version}</span><p className="text-muted-foreground">{desc}</p></div><time className="shrink-0 text-xs text-muted-foreground">{time}</time></li>
            ))}
          </ul></CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Cpu className="size-4" />System Overview</CardTitle><CardDescription>Backend service health and configuration</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">API Status</span><Badge variant="default" className="bg-green-600/10 text-green-600 hover:bg-green-600/10">Healthy</Badge></div><Separator />
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Database</span><Badge variant="default" className="bg-green-600/10 text-green-600 hover:bg-green-600/10">Connected</Badge></div><Separator />
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Node Version</span><span className="font-mono text-xs">v20.12.0</span></div><Separator />
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">NestJS Version</span><span className="font-mono text-xs">v11.0.1</span></div><Separator />
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Prisma Version</span><span className="font-mono text-xs">v5.22.0</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
