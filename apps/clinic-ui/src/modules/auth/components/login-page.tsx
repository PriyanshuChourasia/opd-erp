import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  ClipboardList,
  LogIn,
  Pill,
  Receipt,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { loginSchema, type LoginValues } from "../data/schema";
import { useLogin } from "../data/hooks";

const workflowSteps = [
  { icon: Users, label: "Patient registration" },
  { icon: CalendarClock, label: "Appointment & token queue" },
  { icon: Stethoscope, label: "Consultation & vitals" },
  { icon: ClipboardList, label: "Prescription & lab orders" },
  { icon: Receipt, label: "Billing & POS" },
  { icon: Pill, label: "Pharmacy dispensing" },
];

export function LoginPage() {
  const loginMutation = useLogin();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ─── Left: Branding & workflow ──────────────────────── */}
      <div className="hidden flex-col justify-between bg-muted/30 px-16 py-16 ring-1 ring-border lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark size="lg" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">MyClinic</h1>
              <p className="text-sm text-muted-foreground">Clinic Management System</p>
            </div>
          </div>
          <p className="mt-8 max-w-md text-balance text-2xl font-semibold leading-snug tracking-tight">
            One system for the full clinic workflow.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            From the front desk to the pharmacy counter — every visit stays on
            a single record.
          </p>
        </div>

        <ul className="flex flex-col gap-4">
          {workflowSteps.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center bg-background ring-1 ring-border">
                <Icon className="size-4 text-primary" />
              </span>
              <span className="text-foreground/80">{label}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="size-3.5" />
          <span>Role-based access · Audit-logged · Real-time sync</span>
        </div>
      </div>

      {/* ─── Right: Login form ──────────────────────────────── */}
      <div className="flex flex-col justify-center px-4 py-16 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <BrandMark size="md" />
            <span className="text-lg font-semibold tracking-tight">MyClinic</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to access the clinic management system
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form
                id="login-form"
                onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email or Username</FieldLabel>
                    <Input id="email" placeholder="email@clinic.com or username" autoComplete="username" {...form.register("email")} />
                    <FieldError errors={form.formState.errors.email ? [form.formState.errors.email] : undefined} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <PasswordInput
                      id="password"
                      autoComplete="current-password"
                      {...form.register("password")}
                    />
                    <FieldError errors={form.formState.errors.password ? [form.formState.errors.password] : undefined} />
                  </Field>
                  {loginMutation.isError && (
                    <FieldError>{(loginMutation.error as Error).message}</FieldError>
                  )}
                </FieldGroup>

                <Button
                  type="submit"
                  form="login-form"
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

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                to="/"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
