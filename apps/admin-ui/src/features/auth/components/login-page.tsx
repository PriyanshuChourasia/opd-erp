import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  KeyRound,
  LogIn,
  Network,
  Pill,
  Receipt,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { loginSchema, type LoginValues } from "../data/schema";
import { useLogin } from "../data/hooks";

const GOVERNED_SYSTEMS = [
  { icon: Stethoscope, label: "Clinic UI — front desk & doctor consultation" },
  { icon: Users, label: "Doctor Portal — queue, patients, prescriptions" },
  { icon: Pill, label: "Medicine catalog & pharmacy dispensing" },
  { icon: Receipt, label: "Billing, POS & reports" },
  { icon: KeyRound, label: "Roles, permissions & user provisioning" },
] as const;

export function LoginPage() {
  const loginMutation = useLogin();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@opderp.com",
      password: "Password@123",
    },
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ─── Left: control-center branding ──────────────────── */}
      <div className="hidden flex-col justify-between bg-muted/30 px-16 py-16 ring-1 ring-border lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground ring-1 ring-primary/20">
              <Network className="size-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">OPD ERP</h1>
              <p className="text-sm text-muted-foreground">Head Admin Control Center</p>
            </div>
          </div>
          <p className="mt-8 max-w-md text-balance text-2xl font-semibold leading-snug tracking-tight">
            One login governing every application in the OPD ERP suite.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            This is the central head application — access, roles, and data
            across every clinic, doctor, and pharmacy surface trace back to
            an account signed in here.
          </p>
        </div>

        <ul className="flex flex-col gap-4">
          {GOVERNED_SYSTEMS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center bg-background ring-1 ring-border">
                <Icon className="size-4 text-primary" />
              </span>
              <span className="text-foreground/80">{label}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          <span>Central authority · Role-based access · Audit-logged</span>
        </div>
      </div>

      {/* ─── Right: login form ──────────────────────────────── */}
      <div className="flex flex-col justify-center px-4 py-16 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile-only header */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground ring-1 ring-primary/20">
              <Network className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">OPD ERP Admin</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Head admin sign-in</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in with your super-admin account to manage the entire ERP
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form
                id="admin-login-form"
                onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email or Username *</FieldLabel>
                    <Input
                      id="email"
                      placeholder="admin@opderp.com or username"
                      autoComplete="username"
                      {...form.register("email")}
                    />
                    <FieldError
                      errors={
                        form.formState.errors.email
                          ? [form.formState.errors.email]
                          : undefined
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Password *</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      {...form.register("password")}
                    />
                    <FieldError
                      errors={
                        form.formState.errors.password
                          ? [form.formState.errors.password]
                          : undefined
                      }
                    />
                  </Field>
                  {loginMutation.isError && (
                    <FieldError>
                      {loginMutation.error instanceof Error
                        ? loginMutation.error.message
                        : "Login failed"}
                    </FieldError>
                  )}
                </FieldGroup>

                <Button
                  type="submit"
                  form="admin-login-form"
                  className="mt-6 w-full"
                  size="lg"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="size-4" />
                      Sign in
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 rounded-xl border bg-background px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Demo login — default credentials are pre-filled below
            </p>
            <dl className="mt-2 flex flex-col gap-1 font-mono text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-foreground/90">admin@opderp.com</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Password</dt>
                <dd className="text-foreground/90">Password@123</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Alt</dt>
                <dd className="text-foreground/90">test@example.com / password</dd>
              </div>
            </dl>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Access to this panel is restricted to head administrators.
          </p>
        </div>
      </div>
    </div>
  );
}
