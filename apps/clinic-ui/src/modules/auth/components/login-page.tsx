import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { loginSchema, type LoginValues } from "../data/schema";
import { useLogin } from "../data/hooks";

export function LoginPage() {
  const loginMutation = useLogin();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your credentials to access OPD ERP</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="login-form"
            onSubmit={form.handleSubmit((values) => loginMutation.mutate(values))}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
                <FieldError errors={form.formState.errors.email ? [form.formState.errors.email] : undefined} />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...form.register("password")}
                />
                <FieldError errors={form.formState.errors.password ? [form.formState.errors.password] : undefined} />
              </Field>
              {loginMutation.isError && <FieldError>{(loginMutation.error as Error).message}</FieldError>}
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            form="login-form"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/" className="text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
