import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Hospital,
  Pill,
  Receipt,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { setCredentials } from "@/store/auth-slice";
import { getHomeRoute } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { registerSchema } from "../data/schema";
import type { RegisterResponse } from "../data/interface";
import { apiFetch } from "@/lib/api";

// ─── Data ──────────────────────────────────────────────────────

const trustMarkers = [
  { icon: ShieldCheck, label: "Role-based access control" },
  { icon: Activity, label: "Real-time queue sync" },
  { icon: FileText, label: "Full audit trail" },
] as const;

const features = [
  {
    icon: Users,
    title: "Patient management",
    description:
      "Demographics, medical history, allergies, and emergency contacts kept in one searchable record.",
  },
  {
    icon: CalendarClock,
    title: "Appointment scheduling",
    description:
      "Real-time slot availability with a token-based queue for walk-in, follow-up, and teleconsultation visits.",
  },
  {
    icon: Stethoscope,
    title: "Doctor consultation",
    description:
      "Vitals, diagnosis notes, and prescriptions captured in a single workflow during the visit.",
  },
  {
    icon: ClipboardList,
    title: "Prescriptions & orders",
    description:
      "Digital prescriptions with medicine catalog lookup, plus lab, radiology, and procedure orders.",
  },
  {
    icon: Receipt,
    title: "Billing & POS",
    description:
      "Point-of-sale billing with cash, card, and UPI, discount rules, and a full invoice history.",
  },
  {
    icon: Pill,
    title: "Pharmacy dispensing",
    description:
      "Stock-aware dispensing validated against the prescription record, with live inventory tracking.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description:
      "Granular permissions for admins, doctors, receptionists, and pharmacists — everyone sees only what they need.",
  },
  {
    icon: Activity,
    title: "Live token queue",
    description:
      "Waiting, in-progress, and completed states tracked in real time across the front desk and consultation rooms.",
  },
  {
    icon: FileText,
    title: "Digital records",
    description:
      "Patient data, prescriptions, lab reports, and billing history stored digitally and available on demand.",
  },
] as const;

const workflowSteps = [
  {
    icon: Users,
    label: "Registration",
    description: "Capture demographics and history once, at intake.",
  },
  {
    icon: CalendarClock,
    label: "Appointment & queue",
    description: "Book slots and track walk-ins on a live token queue.",
  },
  {
    icon: Stethoscope,
    label: "Consultation",
    description: "Record vitals and diagnosis at the point of care.",
  },
  {
    icon: ClipboardList,
    label: "Prescriptions & orders",
    description: "Issue prescriptions and lab or radiology orders.",
  },
  {
    icon: Receipt,
    label: "Billing & POS",
    description: "Invoice the visit with multi-payment support.",
  },
  {
    icon: Pill,
    label: "Dispensing",
    description: "Validate and dispense against the prescription.",
  },
] as const;

const capabilities = [
  {
    icon: ShieldCheck,
    title: "Granular permissions",
    description:
      "Admin, doctor, receptionist, and pharmacist roles each get a scoped view of the system — nothing more.",
  },
  {
    icon: Activity,
    title: "Live across the building",
    description:
      "Front desk, consultation rooms, and the pharmacy counter stay in sync on the same queue and record.",
  },
  {
    icon: Receipt,
    title: "Billing tied to the visit",
    description:
      "Invoices generate from the actual consultation and prescription — not a separate, disconnected ledger.",
  },
  {
    icon: FileText,
    title: "Traceable by design",
    description:
      "Every clinical and financial action is recorded against the user and timestamp that made it.",
  },
] as const;

// ─── Component ─────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <AboutSection />
      <CapabilitiesSection />
      <Footer />
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center bg-primary text-primary-foreground">
            <Hospital className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">OPD ERP</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#workflow" className="transition-colors hover:text-foreground">
            Workflow
          </a>
          <a href="#about" className="transition-colors hover:text-foreground">
            About
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <a href="#get-started">
              Get started
              <ArrowRight className="size-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────

function HeroSection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const form = useForm<import("../data/schema").RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const registerMutation = useMutation({
    mutationFn: (values: import("../data/schema").RegisterValues) =>
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
    },
  });

  return (
    <section className="relative overflow-hidden pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_oklch,var(--color-primary)_7%,transparent),transparent)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* ─── Left: copy ──────────────────────────────────── */}
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Clinic operations, in one system
            </p>

            <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Run the whole clinic without leaving one screen
            </h1>

            <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground">
              Registration, the appointment queue, consultation, prescriptions,
              billing, and pharmacy dispensing — connected end to end, so a
              patient's record follows them through every step of the visit.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="text-base" asChild>
                <Link to="/login">
                  Sign in
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-base" asChild>
                <a href="#get-started">Set up your clinic</a>
              </Button>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {trustMarkers.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Icon className="size-4 text-primary" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Right: registration ─────────────────────────── */}
          <div id="get-started" className="mx-auto w-full max-w-md scroll-mt-24 lg:mx-0">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Set up your clinic's workspace</CardTitle>
                <CardDescription>
                  Create the first administrator account for your organisation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit((values) =>
                    registerMutation.mutate(values),
                  )}
                >
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="hero-username">Username</FieldLabel>
                      <Input
                        id="hero-username"
                        placeholder="johndoe"
                        autoComplete="username"
                        {...form.register("username")}
                      />
                      <FieldError
                        errors={
                          form.formState.errors.username
                            ? [form.formState.errors.username]
                            : undefined
                        }
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor="hero-firstName">First name</FieldLabel>
                        <Input
                          id="hero-firstName"
                          placeholder="John"
                          autoComplete="given-name"
                          {...form.register("firstName")}
                        />
                        <FieldError
                          errors={
                            form.formState.errors.firstName
                              ? [form.formState.errors.firstName]
                              : undefined
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="hero-lastName">Last name</FieldLabel>
                        <Input
                          id="hero-lastName"
                          placeholder="Doe"
                          autoComplete="family-name"
                          {...form.register("lastName")}
                        />
                        <FieldError
                          errors={
                            form.formState.errors.lastName
                              ? [form.formState.errors.lastName]
                              : undefined
                          }
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="hero-email">
                        Email address
                      </FieldLabel>
                      <Input
                        id="hero-email"
                        type="email"
                        placeholder="john@clinic.com"
                        autoComplete="email"
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
                      <FieldLabel htmlFor="hero-password">Password</FieldLabel>
                      <Input
                        id="hero-password"
                        type="password"
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
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
                    <Field>
                      <FieldLabel htmlFor="hero-confirm-password">
                        Confirm password
                      </FieldLabel>
                      <Input
                        id="hero-confirm-password"
                        type="password"
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                        {...form.register("confirmPassword")}
                      />
                      <FieldError
                        errors={
                          form.formState.errors.confirmPassword
                            ? [form.formState.errors.confirmPassword]
                            : undefined
                        }
                      />
                    </Field>
                    {registerMutation.isError && (
                      <FieldError>
                        {(registerMutation.error as Error).message}
                      </FieldError>
                    )}
                  </FieldGroup>

                  <Button
                    type="submit"
                    className="mt-6 w-full gap-2 text-base"
                    size="lg"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending
                      ? "Creating account..."
                      : "Create account"}
                    {!registerMutation.isPending && (
                      <ArrowRight className="size-4" />
                    )}
                  </Button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Modules
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One platform for the entire clinic
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every module shares the same patient and visit record — register
            once and the data carries through appointments, consultation,
            billing, and pharmacy.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="bg-background p-6">
              <feature.icon className="size-5 text-primary" />
              <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Workflow ──────────────────────────────────────────────────

function WorkflowSection() {
  return (
    <section id="workflow" className="scroll-mt-16 border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            How it flows
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One visit, one record, six steps
          </h2>
          <p className="mt-4 text-muted-foreground">
            A patient moves through the same six stages every visit. OPD ERP
            keeps them attached to a single record the whole way through.
          </p>
        </div>

        <div className="mt-14 flex flex-col divide-y divide-border border-y border-border lg:flex-row lg:divide-x lg:divide-y-0">
          {workflowSteps.map((step, index) => (
            <div key={step.label} className="flex flex-1 gap-4 py-6 lg:flex-col lg:gap-3 lg:px-6 lg:py-8">
              <div className="flex shrink-0 items-center gap-3 lg:flex-col lg:items-start lg:gap-4">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <step.icon className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{step.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About ─────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section id="about" className="scroll-mt-16 border-t border-border bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              About
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for the clinical workflow, not adapted to it
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
              <p>
                OPD ERP replaces the patchwork most clinics run on — paper
                registers, a separate billing tool, and prescriptions that
                never make it into a searchable record — with a single
                system built around the actual sequence of a visit.
              </p>
              <p>
                Registration, the appointment queue, consultation, orders,
                billing, and pharmacy dispensing are modules of one
                application, not integrations bolted onto each other.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Built with</h3>
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden bg-border">
              {[
                "React 19",
                "TypeScript",
                "NestJS",
                "PostgreSQL",
                "Tailwind CSS",
                "TanStack Router",
                "shadcn/ui",
                "Prisma ORM",
              ].map((tech) => (
                <div
                  key={tech}
                  className="flex items-center gap-2 bg-background px-3 py-2.5 text-sm"
                >
                  <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Capabilities ──────────────────────────────────────────────

function CapabilitiesSection() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Why it holds up
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            What the connected record actually gets you
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {capabilities.map((item) => (
            <div key={item.title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start gap-6 border border-border bg-muted/30 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h3 className="text-xl font-bold tracking-tight">
              Ready to move off paper?
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Create your clinic's workspace and start with the first visit.
            </p>
          </div>
          <Button size="lg" className="shrink-0 text-base" asChild>
            <a href="#get-started">
              Get started
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
                <Hospital className="size-4" />
              </span>
              <span className="text-sm font-semibold">OPD ERP</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A unified clinic management system — registration to pharmacy
              dispensing, in one record.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Platform</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="#features"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Workflow
                </a>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Modules</h4>
            <ul className="mt-4 space-y-2">
              {["Patients", "Appointments", "Billing", "Pharmacy"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} OPD ERP.
        </div>
      </div>
    </footer>
  );
}
