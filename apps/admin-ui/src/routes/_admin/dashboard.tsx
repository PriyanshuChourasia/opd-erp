import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Mail, Network, ShieldCheck, UserRound, IdCard } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasToken } from "@/features/auth/data/auth-store";
import { useMe } from "@/features/auth/data/hooks";

export const Route = createFileRoute("/_admin/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const me = useMe(hasToken());
  const user = me.data;

  const stats = [
    { label: "Name", value: user?.firstName ?? "…", icon: UserRound },
    { label: "Role", value: user?.roleName ?? "…", icon: ShieldCheck },
    { label: "User ID", value: user?.id ?? "…", icon: IdCard },
    { label: "Email", value: user?.email ?? "…", icon: Mail },
  ];

  return (
    <>
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          {user ? `Welcome back, ${user.firstName}` : "Admin dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in with a JWT issued by the admin-api.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="py-4">
            <CardContent className="flex items-center gap-3 px-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="truncate text-sm font-medium">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="size-4 text-primary" />
              API status
            </CardTitle>
            <CardDescription>
              admin-api endpoints behind the configured API base (
              {"https://admin-api.test/api"})
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <StatusRow label="POST /auth/login" ok />
            <StatusRow label="GET /auth/me" ok={Boolean(user)} />
            <StatusRow label="POST /auth/refresh" ok={Boolean(user)} />
            <StatusRow label="POST /auth/logout" ok />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              Demo credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1 font-mono text-sm text-muted-foreground">
              <p>admin@opderp.com / Password@123</p>
              <p>test@example.com / password</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-xs">{label}</span>
      <span
        className={
          ok
            ? "flex items-center gap-1.5 text-xs font-medium text-emerald-600"
            : "flex items-center gap-1.5 text-xs font-medium text-amber-600"
        }
      >
        <span
          className={`size-2 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
        />
        {ok ? "reachable" : "pending"}
      </span>
    </div>
  );
}