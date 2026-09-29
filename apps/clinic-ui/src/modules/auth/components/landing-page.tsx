import { useState } from "react";
import { Link } from "@tanstack/react-router";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Data ──────────────────────────────────────────────────────

const navLinks = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

const calendarWeekdays = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

/** Demo month only — a static visual for the landing page, not a live calendar. */
const calendarBookings: Record<number, number> = {
  2: 3,
  3: 5,
  4: 2,
  6: 4,
  9: 3,
  10: 6,
  11: 2,
  12: 4,
  16: 3,
  17: 5,
  18: 2,
  19: 3,
  23: 4,
  24: 2,
  25: 3,
  26: 5,
  30: 2,
  31: 3,
};
const calendarClosedDays = new Set([1, 8, 15, 22, 29]);
const calendarSelectedDay = 12;

type CalendarCellState = "idle" | "booked" | "closed" | "selected" | "empty";

/** March 2026 starts on a Sunday and has 31 days — five full rows of seven. */
const calendarWeeks: (number | null)[][] = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, 31, null, null, null, null],
];

function calendarCellState(day: number | null): CalendarCellState {
  if (day === null) return "empty";
  if (day === calendarSelectedDay) return "selected";
  if (calendarClosedDays.has(day)) return "closed";
  if (day in calendarBookings) return "booked";
  return "idle";
}

/** Label shown in the hover tooltip — answers "is this day booked?". */
function calendarDayStatus(day: number | null): string {
  if (day === null) return "";
  if (calendarClosedDays.has(day)) return "Clinic closed";
  const count = calendarBookings[day];
  if (count === undefined) return "No appointments";
  return count === 1 ? "1 appointment" : `${count} appointments`;
}

const calendarAppointments = [
  { time: "09:00", patient: "A. Sharma", state: "seen" },
  { time: "09:30", patient: "R. Menon", state: "seen" },
  { time: "10:15", patient: "S. Iyer", state: "waiting" },
  { time: "11:00", patient: "K. Nair", state: "upcoming" },
] as const;

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
    <div id="top" className="flex min-h-screen scroll-mt-16 flex-col">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <AboutSection />
      <CapabilitiesSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full bg-background/90 backdrop-blur-lg">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center bg-primary text-primary-foreground">
            <Hospital className="size-5" />
          </span>
          <span className="truncate text-lg font-semibold tracking-tight">
            MyOPD
          </span>
        </Link>

        <div className="flex items-center justify-end gap-3 sm:gap-6">
          <nav className="grid grid-cols-3 items-center gap-3 text-sm text-muted-foreground sm:gap-6">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group relative whitespace-nowrap py-2 transition-colors duration-300 hover:text-foreground"
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100"
                />
              </a>
            ))}
          </nav>
          <Button
            size="lg"
            asChild
            className="h-10 gap-2 px-5 text-base shadow-sm transition-shadow hover:shadow-md"
          >
            <Link to="/register">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_oklch,var(--color-primary)_7%,transparent),transparent)]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
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
                <Link to="/register">Set up your clinic</Link>
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

          {/* ─── Right: schedule ─────────────────────────────── */}
          <div className="w-full max-w-lg">
            <ScheduleCalendar />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Schedule calendar ─────────────────────────────────────────

function ScheduleCalendar() {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // March 2026 begins on a Sunday, so day N sits at row (N-1)/7, col (N-1)%7.
  // That lets the tooltip anchor with percentages instead of measuring the DOM.
  const hoveredIndex = hoveredDay === null ? -1 : hoveredDay - 1;
  const tooltipRow = hoveredIndex >= 0 ? Math.floor(hoveredIndex / 7) : -1;
  const tooltipCol = hoveredIndex >= 0 ? hoveredIndex % 7 : -1;
  const tooltipBelow = tooltipRow >= 0 && tooltipRow < 3;

  return (
    <Card className="gap-0 rounded-2xl border border-border/70 bg-card/70 shadow-lg shadow-foreground/5 backdrop-blur-sm">
      <CardHeader className="rounded-t-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="grid gap-1">
            <CardTitle className="text-xl">Today&rsquo;s schedule</CardTitle>
            <CardDescription>
              March 2026 &middot; hover a date for details
            </CardDescription>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarClock className="size-4" />
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative rounded-xl border border-border bg-border">
          <div className="grid grid-cols-7 gap-px text-center text-[0.7rem] font-medium uppercase tracking-wide">
            {calendarWeekdays.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "bg-card/80 py-2",
                  index === 0 && "rounded-tl-xl",
                  index === calendarWeekdays.length - 1 && "rounded-tr-xl",
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Positioning context covers only the day rows, so the row/5
              percentages below land on the correct cell. */}
          <div className="relative mt-px flex flex-col gap-px text-center text-sm">
            {calendarWeeks.map((week, weekIndex) => {
              const isLastRow = weekIndex === calendarWeeks.length - 1;
              return (
                <div key={weekIndex} className="grid grid-cols-7 gap-px">
                  {week.map((day, dayIndex) => {
                    const state = calendarCellState(day);
                    const isHovered = day !== null && day === hoveredDay;
                    return (
                      <div
                        key={day ?? `${weekIndex}-${dayIndex}`}
                        onMouseEnter={() => day !== null && setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={cn(
                          "flex h-9 cursor-default flex-col items-center justify-center gap-1 bg-card/80 sm:h-10 lg:h-11",
                          isLastRow && dayIndex === 0 && "rounded-bl-xl",
                          isLastRow && dayIndex === 6 && "rounded-br-xl",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-sm tabular-nums transition-colors sm:size-7",
                            state === "selected" &&
                              "font-semibold text-primary ring-2 ring-primary",
                            state === "booked" && "font-medium text-foreground",
                            state === "closed" &&
                              "text-muted-foreground/50 line-through",
                            state === "empty" && "text-transparent",
                            isHovered &&
                              state !== "selected" &&
                              "ring-2 ring-primary/45",
                          )}
                        >
                          {day}
                        </span>
                        {(state === "booked" || state === "selected") && (
                          <span
                            aria-hidden="true"
                            className="size-1 rounded-full bg-primary/70"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Hover readout — anchored to the cell, flipped above on the last rows
              so it never spills past the bottom of the card. */}
            {hoveredDay !== null && (
              <div
                role="status"
                className={cn(
                  "pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md",
                  tooltipBelow ? "translate-y-0" : "-translate-y-full",
                )}
                style={{
                  left: `${((tooltipCol + 0.5) / 7) * 100}%`,
                  top: `${((tooltipRow + (tooltipBelow ? 1 : 0)) / 5) * 100}%`,
                  marginTop: tooltipBelow ? 6 : -6,
                }}
              >
                {hoveredDay} Mar &middot; {calendarDayStatus(hoveredDay)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Thu, 12 March</h3>
            <span className="text-xs text-muted-foreground">
              2 seen &middot; 1 in queue
            </span>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {calendarAppointments.map((slot) => (
              <li
                key={`${slot.time}-${slot.patient}`}
                className="flex items-center gap-3 rounded-full border border-border/70 px-3 py-2.5"
              >
                <span className="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {slot.time}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {slot.patient}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    slot.state === "waiting" &&
                      "text-amber-600 dark:text-amber-500",
                    slot.state === "seen" && "text-muted-foreground",
                    slot.state === "upcoming" && "text-primary",
                  )}
                >
                  {slot.state === "waiting"
                    ? "In queue"
                    : slot.state === "seen"
                      ? "Seen"
                      : "Upcoming"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Features ──────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-16 border-t border-border py-24"
    >
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
    <section
      id="workflow"
      className="scroll-mt-16 border-t border-border py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            How it flows
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One visit, one record, six steps
          </h2>
          <p className="mt-4 text-muted-foreground">
            A patient moves through the same six stages every visit. MyOPD keeps
            them attached to a single record the whole way through.
          </p>
        </div>

        <div className="mt-14 flex flex-col divide-y divide-border border-y border-border lg:flex-row lg:divide-x lg:divide-y-0">
          {workflowSteps.map((step, index) => (
            <div
              key={step.label}
              className="flex flex-1 gap-4 py-6 lg:flex-col lg:gap-3 lg:px-6 lg:py-8"
            >
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
    <section
      id="about"
      className="scroll-mt-16 border-t border-border bg-muted/30 py-24"
    >
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
                MyOPD replaces the patchwork most clinics run on — paper
                registers, a separate billing tool, and prescriptions that never
                make it into a searchable record — with a single system built
                around the actual sequence of a visit.
              </p>
              <p>
                Registration, the appointment queue, consultation, orders,
                billing, and pharmacy dispensing are modules of one application,
                not integrations bolted onto each other.
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
            <Link to="/register">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Contact ───────────────────────────────────────────────────

const contactChannels = [
  {
    icon: Stethoscope,
    title: "Sales enquiries",
    description:
      "Tell us how your clinic runs today and we'll map the rollout.",
    action: "sales@myopd.com",
    href: "mailto:sales@myopd.com",
  },
  {
    icon: Activity,
    title: "Support",
    description: "Existing customers get a reply within one business day.",
    action: "support@myopd.com",
    href: "mailto:support@myopd.com",
  },
] as const;

function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-16 border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Contact
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Talk to someone who knows the workflow
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Questions about migration, pricing, or how a specific module fits
            your clinic — reach out and we will walk through it.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {contactChannels.map((channel) => (
            <div
              key={channel.title}
              className="flex flex-col border border-border p-8"
            >
              <span className="flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                <channel.icon className="size-5" />
              </span>
              <h3 className="mt-6 text-sm font-semibold">{channel.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {channel.description}
              </p>
              <a
                href={channel.href}
                className="mt-6 text-sm font-medium text-primary transition-colors hover:underline"
              >
                {channel.action}
              </a>
            </div>
          ))}
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
              <span className="text-sm font-semibold">MyOPD</span>
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
              {["Patients", "Appointments", "Billing", "Pharmacy"].map(
                (item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} MyOPD.
        </div>
      </div>
    </footer>
  );
}
