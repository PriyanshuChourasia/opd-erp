import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { loginSchema, type LoginValues, useLogin } from "../data";

export function LoginPage() {
  const loginMutation = useLogin();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-border">
            <img src="/opdlogo.png" alt="Admin" className="size-full object-contain p-1" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Admin Panel</span>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to access the administration dashboard
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
                  <FieldLabel htmlFor="email">Email or Username *</FieldLabel>
                  <Input
                    id="email"
                    placeholder="email@example.com or username"
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
                    {(loginMutation.error as Error).message}
                  </FieldError>
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

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="size-3.5" />
          <span>Role-based access · Secure authentication</span>
        </div>
      </div>
    </div>
  );
}
