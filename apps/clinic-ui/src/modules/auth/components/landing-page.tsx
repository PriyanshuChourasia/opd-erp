import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Gamepad2,
  Hospital,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Phone,
  Pill,
  Receipt,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { setCredentials } from "@/store/auth-slice";
import { getHomeRoute } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { registerSchema, type RegisterValues } from "../data/schema";
import type { RegisterResponse } from "../data/interface";
import { apiFetch } from "@/lib/api";

// ─── Feature data ──────────────────────────────────────────────

const features = [
  {
    icon: Users,
    title: "Patient Management",
    description:
      "Register, search, and maintain comprehensive patient records — demographics, medical history, allergies, and emergency contacts in one place.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: CalendarClock,
    title: "Appointment Scheduling",
    description:
      "Manage appointments with real-time slot availability, token-based queue system, and multi-type support — walk-in, consultation, follow-up, and teleconsultation.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Stethoscope,
    title: "Doctor Consultation",
    description:
      "Streamlined consultation workflow with vitals recording, diagnosis notes, and direct prescription generation during patient visits.",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: ClipboardList,
    title: "Prescriptions & Orders",
    description:
      "Digital prescriptions with medicine catalog lookup, lab test orders, radiology requests, and procedure orders — all paperless.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Receipt,
    title: "Billing & POS",
    description:
      "Full point-of-sale system with multi-payment support (CASH, CARD, UPI), discount management, invoice generation, and billing history.",
    color: "bg-rose-500/10 text-rose-600",
  },
  {
    icon: Pill,
    title: "Pharmacy Dispensing",
    description:
      "End-to-end pharmacy workflow with medicine catalog, stock tracking, dispensing validation against prescriptions, and inventory management.",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    description:
      "Granular permissions system with roles (Admin, Doctor, Receptionist, Pharmacist) — each user sees only what they need.",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    icon: Activity,
    title: "Real-Time Queue",
    description:
      "Live token queue with digital display, status tracking (waiting, in-progress, completed), and SMS-ready patient notifications.",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    icon: FileText,
    title: "Digital Records",
    description:
      "All patient data, prescriptions, lab reports, and billing history stored digitally — accessible anytime, anywhere with zero paperwork.",
    color: "bg-teal-500/10 text-teal-600",
  },
] as const;

const stats = [
  { value: "10+", label: "Clinic Modules" },
  { value: "99.9%", label: "Uptime" },
  { value: "< 2s", label: "Response Time" },
  { value: "Zero", label: "Paper Required" },
] as const;

const comparisons = [
  {
    manual: "Paper registers and files",
    auto: "Digital patient records searchable in seconds",
    icon: FileText,
  },
  {
    manual: "Handwritten prescriptions (illegible)",
    auto: "Type-safe digital prescriptions with medicine catalog",
    icon: ScrollText,
  },
  {
    manual: "Manual billing with calculators",
    auto: "Automated billing with tax, discount, and multi-payment",
    icon: Receipt,
  },
  {
    manual: "Lost appointment slips",
    auto: "Real-time token queue with digital tracking",
    icon: Clock,
  },
  {
    manual: "Hours of end-of-day reconciliation",
    auto: "Instant reports and automated audit trails",
    icon: Monitor,
  },
  {
    manual: "Separate systems that don't talk",
    auto: "Unified platform — register once, use everywhere",
    icon: Gamepad2,
  },
] as const;

// ─── Component ─────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <AboutSection />
      <ComparisonSection />
      <WhySection />
      <ContactSection />
      <Footer />
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center bg-primary text-primary-foreground shadow-sm">
            <Hospital className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            OPD ERP
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <a href="#register">
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

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
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
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      {/* Decorative grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Floating orbs */}
      <div className="absolute -left-32 -top-32 size-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ─── Left: Hero copy ─────────────────────────────── */}
          <div className="max-w-xl">
            <Badge variant="secondary" className="mb-6 px-3 py-1 text-xs">
              <Zap className="mr-1 size-3" />
              One system. Every workflow.
            </Badge>

            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              The Clinic Operating System Your{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                Practice Deserves
              </span>
            </h1>

            <p className="mt-6 text-balance text-lg text-muted-foreground sm:text-xl">
              From the front desk queue to the pharmacy counter — one unified
              platform manages your entire clinic workflow. No paper, no chaos,
              no separate systems.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="text-base"
                asChild
              >
                <a href="#features">
                  <BookOpen className="size-4" />
                  Explore Features
                </a>
              </Button>
              <Button
                size="lg"
                className="text-base"
                asChild
              >
                <a href="#register">
                  Get Started Free
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" />
                Free setup
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" />
                24/7 support
              </span>
            </div>
          </div>

          {/* ─── Right: Registration form ──────────────────── */}
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <Card className="border-border/60 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Create your account</CardTitle>
                <CardDescription>
                  Fill in the details below to start using OPD ERP.
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
                      <FieldLabel htmlFor="hero-name">Full name</FieldLabel>
                      <Input
                        id="hero-name"
                        placeholder="Dr. John Doe"
                        autoComplete="name"
                        {...form.register("name")}
                      />
                      <FieldError
                        errors={
                          form.formState.errors.name
                            ? [form.formState.errors.name]
                            : undefined
                        }
                      />
                    </Field>
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
                      : "Create your account"}
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

            {/* Quick trust badges below the form */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, text: "SSL Encrypted" },
                { icon: Clock, text: "Instant access" },
                { icon: Users, text: "Multi-user" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center justify-center gap-1.5 rounded-none border bg-card px-3 py-2 text-xs text-muted-foreground"
                >
                  <item.icon className="size-3.5 text-primary" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats ─────────────────────────────────────────────────────

function StatsSection() {
  return (
    <section className="relative border-y border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="features" className="relative scroll-mt-20 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            Everything You Need
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            One platform for your entire clinic
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every module is designed to work together seamlessly — register a
            patient once and they flow through appointments, consultation,
            billing, and pharmacy without re-entering data.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <CardHeader>
                <div
                  className={`mb-2 flex size-10 items-center justify-center ${feature.color}`}
                >
                  <feature.icon className="size-5" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About ─────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section className="relative border-y border-border/40 bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="secondary" className="mb-4">
              About OPD ERP
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for clinics, by healthcare IT professionals
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                OPD ERP is a modern, open-source clinic management system
                designed to replace fragmented, paper-based workflows with a
                single digital platform. From the moment a patient walks in to
                the moment they leave with their medicine, every step is
                tracked, every record is saved, and every transaction is
                accounted for.
              </p>
              <p>
                Unlike generic ERP systems that force your clinic to adapt to
                rigid software, OPD ERP is built from the ground up for
                the clinical workflow — patient registration, appointment
                queue, doctor consultation, lab orders, pharmacy dispensing,
                and billing — all in one place, all in real time.
              </p>
              <p>
                Built with modern web technologies (React, TypeScript, NestJS,
                PostgreSQL) and a clean, responsive interface that works on
                desktops and tablets alike.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-none border bg-card p-8 shadow-sm">
              <h3 className="text-lg font-semibold">Tech Stack</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
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
                    className="flex items-center gap-2 rounded-none border bg-background px-3 py-2 text-sm"
                  >
                    <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                    {tech}
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute -right-4 -top-4 -z-10 size-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 -z-10 size-32 rounded-full bg-primary/10 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Comparison ────────────────────────────────────────────────

function ComparisonSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            Why Switch?
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ditch the paper, embrace the digital
          </h2>
          <p className="mt-4 text-muted-foreground">
            Most clinics still run on a patchwork of paper registers, separate
            billing software, and handwritten prescriptions. OPD ERP
            replaces it all.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {comparisons.map((item) => (
            <div
              key={item.manual}
              className="group relative rounded-none border bg-card p-5 transition-all duration-300 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center bg-primary/10 text-primary">
                  <item.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <span className="text-sm text-muted-foreground">
                      {item.manual}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-sm font-medium">{item.auto}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-none border bg-gradient-to-br from-primary/5 to-primary/[0.02] p-8 text-center sm:p-12">
          <div className="mx-auto max-w-xl">
            <h3 className="text-2xl font-bold tracking-tight">
              What does this mean for your clinic?
            </h3>
            <ul className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              {[
                "No more lost files",
                "Faster patient check-ins",
                "Accurate billing every time",
                "Real-time clinic overview",
                "Reduced administrative overhead",
                "Better patient experience",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Why (formerly Register, now a benefit callout) ────────────

function WhySection() {
  return (
    <section
      id="register"
      className="relative scroll-mt-20 border-y border-border/40 bg-muted/30 py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Why OPD ERP?
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Start transforming your clinic today
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            No credit card. No commitment. Just a modern system that your staff
            will love using and your patients will notice.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {[
            {
              icon: Zap,
              title: "Ready in minutes",
              desc: "Cloud-based setup with no infrastructure to manage. Start using the system immediately after sign-up.",
            },
            {
              icon: ShieldCheck,
              title: "Enterprise-grade security",
              desc: "SSL-encrypted data, role-based access control, and automated backups to keep your data safe.",
            },
            {
              icon: MessageSquare,
              title: "Free onboarding support",
              desc: "Our team helps your staff get up to speed with personalized training sessions at no extra cost.",
            },
            {
              icon: Hospital,
              title: "Built for Indian clinics",
              desc: "Designed for the workflows, regulations, and requirements of healthcare practices in India.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group flex items-start gap-4 rounded-none border bg-card p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </span>
              <div>
                <h4 className="text-sm font-semibold">{item.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button
            size="lg"
            className="h-12 gap-2 px-6 text-base"
            asChild
          >
            <a href="#">
              Start Free Now
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Contact ───────────────────────────────────────────────────

function ContactSection() {
  return (
    <section id="contact" className="relative scroll-mt-20 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            Get in Touch
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Need help setting up?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Our team provides free onboarding assistance for clinics. Whether
            you need help with deployment, configuration, or training — we're
            here to help.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader>
              <div className="mx-auto flex size-12 items-center justify-center bg-primary/10">
                <Mail className="size-5 text-primary" />
              </div>
              <CardTitle className="mt-2">Email</CardTitle>
              <CardDescription className="mt-1">
                <a
                  href="mailto:support@opderp.com"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  support@opderp.com
                </a>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader>
              <div className="mx-auto flex size-12 items-center justify-center bg-primary/10">
                <Phone className="size-5 text-primary" />
              </div>
              <CardTitle className="mt-2">Phone</CardTitle>
              <CardDescription className="mt-1">
                <a
                  href="tel:+15551234567"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  +1 (555) 123-4567
                </a>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader>
              <div className="mx-auto flex size-12 items-center justify-center bg-primary/10">
                <MapPin className="size-5 text-primary" />
              </div>
              <CardTitle className="mt-2">Location</CardTitle>
              <CardDescription className="mt-1">
                Available worldwide — remote setup & support
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader>
              <div className="mx-auto flex size-12 items-center justify-center bg-primary/10">
                <Clock className="size-5 text-primary" />
              </div>
              <CardTitle className="mt-2">Response Time</CardTitle>
              <CardDescription className="mt-1">
                Usually within 2-4 hours on business days
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-8 rounded-none border bg-muted/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            For custom deployments, on-premise setup, training workshops, and
            enterprise support —{" "}
            <a
              href="mailto:sales@opderp.com"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              contact our sales team
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
                <Hospital className="size-4" />
              </span>
              <span className="text-sm font-semibold">OPD ERP</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              The open-source clinic management system for modern healthcare
              practices.
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
                  href="#register"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Modules</h4>
            <ul className="mt-4 space-y-2">
              {[
                "Patients",
                "Appointments",
                "Billing",
                "Pharmacy",
                "Reports",
              ].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Contact</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="mailto:support@opderp.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  support@opderp.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+15551234567"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  +1 (555) 123-4567
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/40 pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} OPD ERP. Open source. Built
          with care.
        </div>
      </div>
    </footer>
  );
}
