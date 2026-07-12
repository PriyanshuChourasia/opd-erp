import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  CalendarClock,
  ClipboardList,
  Pill,
  Receipt,
  Stethoscope,
  Users,
} from "lucide-react";
import { setCredentials } from "@/store/auth-slice";
import { getHomeRoute } from "@/lib/roles";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
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
import { registerSchema, type RegisterValues } from "../data/schema";
import type { RegisterResponse } from "../data/interface";

const workflowSteps = [
  { icon: Users, label: "Patient registration" },
  { icon: CalendarClock, label: "Appointment & token queue" },
  { icon: Stethoscope, label: "Consultation & vitals" },
  { icon: ClipboardList, label: "Prescription & lab orders" },
  { icon: Receipt, label: "Billing & POS" },
  { icon: Pill, label: "Pharmacy dispensing" },
];

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: values.username,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
        }),
      }),
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      navigate({ to: getHomeRoute(data.user.roleName) });
      toast.success("Account created successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center gap-8 bg-muted px-8 py-16 lg:px-16">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">OPD ERP</h1>
          <p className="mt-3 max-w-md text-lg text-muted-foreground">
            One system for the full clinic workflow — from the front desk to the pharmacy counter.
          </p>
        </div>
        <ul className="flex max-w-md flex-col gap-3">
          {workflowSteps.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-none bg-background ring-1 ring-foreground/10">
                <Icon className="size-4 text-primary" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Register to get started with OPD ERP</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="register-form"
              onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input id="username" placeholder="johndoe" autoComplete="username" {...form.register("username")} />
                  <FieldError errors={form.formState.errors.username ? [form.formState.errors.username] : undefined} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="firstName">First name</FieldLabel>
                    <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
                    <FieldError errors={form.formState.errors.firstName ? [form.formState.errors.firstName] : undefined} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                    <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
                    <FieldError errors={form.formState.errors.lastName ? [form.formState.errors.lastName] : undefined} />
                  </Field>
                </div>
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
                    autoComplete="new-password"
                    {...form.register("password")}
                  />
                  <FieldError errors={form.formState.errors.password ? [form.formState.errors.password] : undefined} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...form.register("confirmPassword")}
                  />
                  <FieldError
                    errors={form.formState.errors.confirmPassword ? [form.formState.errors.confirmPassword] : undefined}
                  />
                </Field>
                {registerMutation.isError && (
                  <FieldError>{(registerMutation.error as Error).message}</FieldError>
                )}
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              form="register-form"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating account..." : "Register"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
