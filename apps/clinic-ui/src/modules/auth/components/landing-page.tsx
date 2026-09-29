import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  FlaskConical,
  Menu,
  Hospital,
  Mail,
  MapPin,
  Monitor,
  Pill,
  Printer,
  Receipt,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Timer,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Reveal } from "@/modules/auth/components/reveal";
import { useInView } from "@/modules/auth/hooks/use-in-view";

// ─── Shared hooks ──────────────────────────────────────────────

/** True while `document.hidden`, updating on visibilitychange. */
function useDocumentHidden() {
  const [hidden, setHidden] = useState(
    () => typeof document !== "undefined" && document.hidden,
  );
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  return hidden;
}

/** Reactive prefers-reduced-motion. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** True while the ref'd element is intersecting the viewport. */
function useElementInView() {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.15 },
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);
  return [setRef, inView] as const;
}

/**
 * setInterval that only runs while the bound element is on screen and the
 * document is visible — landing animations never burn CPU in a background
 * tab or below the fold. Attach the returned ref to the animated container.
 */
function useIntervalWhenVisible(callback: () => void, delayMs: number) {
  const hidden = useDocumentHidden();
  const [setRef, inView] = useElementInView();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const active = inView && !hidden;

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => callbackRef.current(), delayMs);
    return () => window.clearInterval(id);
  }, [active, delayMs]);

  return setRef;
}

// ─── Data ──────────────────────────────────────────────────────

const navLinks = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#features" },
  { label: "For Your Team", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

/** Plain text for the marquee track (one copy of it). */
const tickerModules = [
  { icon: User, label: "Patient registration" },
  { icon: CalendarClock, label: "Appointments" },
  { icon: Timer, label: "Token queue" },
  { icon: Stethoscope, label: "Consultation" },
  { icon: FileText, label: "e-Prescriptions" },
  { icon: FlaskConical, label: "Lab orders" },
  { icon: ScanLine, label: "Radiology" },
  { icon: ClipboardList, label: "Procedures" },
  { icon: Receipt, label: "Billing" },
  { icon: Pill, label: "Dispensing" },
  { icon: Activity, label: "Reports" },
  { icon: ShieldCheck, label: "Allergies & diagnoses" },
] as const;

const heroTrustChecks = [
  "Role-based access",
  "Printable Rx & slips",
  "Live waiting-room display",
] as const;

type QueueState = "waiting" | "in-queue" | "in-consultation" | "completed";

const heroQueue: {
  token: string;
  patient: string;
  doctor: string;
  state: QueueState;
}[] = [
  { token: "T-011", patient: "A. Sharma", doctor: "Dr. Rao", state: "waiting" },
  { token: "T-012", patient: "R. Menon", doctor: "Dr. Iyer", state: "in-queue" },
  { token: "T-013", patient: "S. Khan", doctor: "Dr. Rao", state: "in-consultation" },
  { token: "T-014", patient: "K. Nair", doctor: "Dr. Iyer", state: "completed" },
];

const queueStateStyles: Record<QueueState, string> = {
  waiting: "bg-muted text-muted-foreground",
  "in-queue": "bg-warning-soft text-warning-foreground",
  "in-consultation": "bg-info-soft text-info-foreground",
  completed: "bg-success-soft text-success-foreground",
};

const queueStateLabels: Record<QueueState, string> = {
  waiting: "Waiting",
  "in-queue": "In-Queue",
  "in-consultation": "In consultation",
  completed: "Completed",
};

/** March 2026 starts on a Sunday and has 31 days — five full rows of seven. */
const calendarWeeks: (number | null)[][] = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, 31, null, null, null, null],
];

/** Demo month — a static visual for the floating calendar card, not live data. */
const calendarBookings = new Set([2, 3, 4, 6, 9, 10, 11, 12, 16, 17, 19, 23, 24, 25, 30]);
const calendarClosedDays = new Set([1, 8, 15, 22, 29]);
const calendarSelectedDay = 12;

const bentoTiles = [
  {
    span: "md:col-span-4 md:row-span-2",
    icon: Timer,
    title: "Smart token queue",
    description:
      "Walk-ins and check-ins get a live token, and the whole floor sees the same queue in real time.",
    kind: "queue" as const,
  },
  {
    span: "md:col-span-2",
    icon: CalendarClock,
    title: "Appointments & slots",
    description:
      "Real-time slot availability — booked and free at a glance, with walk-ins slotted around them.",
    kind: "slots" as const,
  },
  {
    span: "md:col-span-2",
    icon: FileText,
    title: "Digital prescriptions",
    description:
      "Catalog-backed Rx writing, reusable templates, and print-ready prescriptions in one step.",
    kind: "rx" as const,
  },
  {
    span: "md:col-span-3",
    icon: Receipt,
    title: "Billing & dispensing",
    description:
      "POS billing with cash, card and UPI; stock-aware dispensing validated against the prescription.",
    kind: "billing" as const,
  },
  {
    span: "md:col-span-3",
    icon: Activity,
    title: "Reports",
    description:
      "Daily OPD summaries, revenue and doctor-wise load. Demo chart shown with sample data.",
    kind: "reports" as const,
  },
] as const;

const workflowSteps = [
  {
    icon: Users,
    label: "Register",
    description: "Capture demographics and history once, at intake.",
    role: "Receptionist",
  },
  {
    icon: CalendarClock,
    label: "Book / Walk-in",
    description:
      "Reserve a slot or walk in — booking alone doesn't enter the queue.",
    role: "Patient",
  },
  {
    icon: BadgeCheck,
    label: "Check-in (In-Queue)",
    description:
      "The front desk checks the patient in — only now do they get a token and join the queue.",
    role: "Receptionist",
  },
  {
    icon: Stethoscope,
    label: "Consult",
    description: "Vitals, diagnosis and notes at the point of care.",
    role: "Doctor",
  },
  {
    icon: ClipboardList,
    label: "Rx & Orders",
    description: "Issue prescriptions and lab or radiology orders.",
    role: "Doctor",
  },
  {
    icon: Receipt,
    label: "Bill & Dispense",
    description: "Invoice the visit and dispense against the prescription.",
    role: "Cashier",
  },
] as const;

const roleTabs = [
  {
    value: "admin",
    label: "Admin",
    icon: Building2,
    bullets: [
      "Doctors & shifts",
      "Medicine catalog",
      "Roles & permissions",
      "Reports",
    ],
    panel: "admin" as const,
  },
  {
    value: "doctor",
    label: "Doctor",
    icon: Stethoscope,
    bullets: [
      "My patients",
      "Consult workspace",
      "Prescription templates",
      "Rx PDF",
    ],
    panel: "doctor" as const,
  },
  {
    value: "reception",
    label: "Reception",
    icon: ClipboardList,
    bullets: ["Token queue", "Check-in", "Appointment slips", "Billing"],
    panel: "reception" as const,
  },
  {
    value: "patient",
    label: "Patient",
    icon: User,
    bullets: ["Appointments", "Bills", "Lab orders", "Prescriptions"],
    panel: "patient" as const,
  },
] as const;

const principles = [
  { icon: Timer, title: "Fast front desk" },
  { icon: Stethoscope, title: "Doctor-first" },
  { icon: Printer, title: "Printable everything" },
  { icon: ShieldCheck, title: "Secure by role" },
] as const;

const contactChannels = [
  {
    icon: Mail,
    title: "Sales enquiries",
    description: "Tell us how your clinic runs today and we'll map the rollout.",
    action: "sales@myopd.com",
    href: "mailto:sales@myopd.com",
  },
  {
    icon: BedDouble,
    title: "Waiting-room display",
    description:
      "A live token board for the waiting area — open it on any screen, no extra login.",
    action: "Open /display",
    href: "/display",
  },
] as const;

const contactFormSchema = z.object({
  name: z.string().min(1, "Please tell us your name"),
  clinic: z.string().min(1, "Please add your clinic name"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]{7,15}$/, "Enter a valid phone number"),
  message: z.string().min(10, "A sentence or two helps us prepare"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

// ─── Component ─────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div id="top" className="flex min-h-screen scroll-mt-16 flex-col">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <WorkflowSection />
        <RolesSection />
        <CtaBand />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

// ─── Section header (shared rhythm) ────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-2xl", className)}>
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h2>
      {lead && (
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {lead}
        </p>
      )}
    </Reveal>
  );
}

// ─── Navbar ────────────────────────────────────────────────────

const pillScrollThresholdPx = 12;

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // "top" wraps the whole page, so it's excluded from section observation —
  // Home is the active link whenever no section is in the tracking band.
  const activeSection = useActiveSection(
    navLinks
      .map((link) => link.href.slice(1))
      .filter((id) => id !== "top"),
  );

  // Passive scroll listener — flips the floating-pill look past 12px.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > pillScrollThresholdPx);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full">
      <div
        className={cn(
          "mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6",
          scrolled
            ? "mt-3 rounded-full border border-border bg-background/70 pl-4 pr-2 shadow-sm backdrop-blur-xl"
            : "mt-0 border border-transparent bg-transparent pl-4 pr-2",
        )}
      >
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Hospital className="size-5" />
          </span>
          <span className="truncate text-lg font-semibold tracking-tight">
            MyOPD
          </span>
        </Link>

        {/* Desktop links — active section gets a sliding underline */}
        <nav
          aria-label="Sections"
          className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"
        >
          {navLinks.map((item) => {
            const id = item.href.slice(1);
            const isActive =
              id === "top" ? activeSection === null : activeSection === id;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group relative whitespace-nowrap py-2 transition-colors duration-300 hover:text-foreground",
                  isActive && "text-foreground",
                )}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-full bg-primary transition-transform duration-300 ease-out",
                    isActive
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="group hidden items-center gap-1.5 sm:inline-flex" asChild>
            <Link to="/register">
              Set up your clinic
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>

          {/* Mobile hamburger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Hospital className="size-4" />
                  </span>
                  MyOPD
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Navigation menu
                </SheetDescription>
              </SheetHeader>
              <nav
                aria-label="Sections"
                className="flex flex-col gap-1 px-4"
                onClick={() => setSheetOpen(false)}
              >
                {navLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 p-4">
                <Button variant="outline" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">
                    Set up your clinic
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

/**
 * Track which landing section is currently in view via IntersectionObserver
 * — drives the navbar's sliding underline.
 */
function useActiveSection(sectionIds: string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          } else {
            // Scrolled past the active section — fall back to Home.
            setActive((current) =>
              current === entry.target.id ? null : current,
            );
          }
        }
      },
      // A band around the upper-middle of the viewport decides the active
      // section; sections "enter" it as they scroll past the navbar.
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [sectionIds]);

  return active;
}

// ─── Hero ──────────────────────────────────────────────────────

function HeroSection() {
  const reducedMotion = usePrefersReducedMotion();

  // Drive the mock queue: every 2.5s the board advances one step. The
  // interval only runs while the section is on screen and the tab visible.
  const [queueTick, setQueueTick] = useState(0);
  const setHeroRef = useIntervalWhenVisible(
    () => setQueueTick((tick) => tick + 1),
    2500,
  );
  // With reduced motion the mock stays a static board — never attach the
  // visibility ref, so the interval never activates.

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden pt-16"
    >
      {/* Gradient blobs */}
      <div
        aria-hidden="true"
        className="lp-blob pointer-events-none absolute -top-24 -left-24 -z-10 size-96 bg-primary/30 opacity-30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="lp-blob pointer-events-none absolute top-1/3 -right-24 -z-10 size-[28rem] bg-emerald-400/30 opacity-30 blur-3xl [animation-delay:-6s]"
      />
      <div
        aria-hidden="true"
        className="lp-blob pointer-events-none absolute bottom-0 left-1/3 -z-10 size-80 bg-sky-400/20 opacity-30 blur-3xl [animation-delay:-12s]"
      />

      {/* Faint grid, radially masked */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:44px_44px] opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]"
      />

      <div
        ref={reducedMotion ? undefined : setHeroRef}
        className="relative mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-12 sm:px-6 lg:py-16"
      >
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* ─── Left: copy ──────────────────────────────────── */}
          <div>
            <Reveal delay={0}>
              <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
                From walk-in to prescription —{" "}
                <span className="lp-shimmer bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent">
                  one calm flow
                </span>
                .
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Registration, appointments, token queue, consultation,
                prescriptions, lab orders, billing and dispensing in one system
                — with dedicated screens for admin, doctor, reception and
                patients.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="text-base" asChild>
                  <Link to="/register">
                    Set up your clinic
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base"
                  asChild
                >
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={380}>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                {heroTrustChecks.map((label) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {label}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* ─── Right: animated product mock ────────────────── */}
          <Reveal delay={400} className="hidden md:block">
            <div className="relative mx-auto w-full max-w-lg">
              <HeroQueueMock tick={queueTick} />

              {/* Satellite cards */}
              <div className="lp-float absolute -top-6 -right-4 z-10 hidden md:block [animation-delay:-1s]">
                <NowServingCard token="T-014" />
              </div>
              <div className="lp-float absolute -bottom-10 -left-6 z-10 hidden md:block [animation-delay:-3s]">
                <MiniPrescriptionCard />
              </div>
              <div className="lp-float absolute top-1/2 -right-10 z-10 hidden lg:block [animation-delay:-2s]">
                <BillPaidChip />
              </div>
              <div className="lp-float absolute -bottom-14 -right-6 z-10 hidden w-56 lg:block [animation-delay:-4s]">
                <ScheduleCalendar />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function QueueChip({ state }: { state: QueueState }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-2xs font-medium",
        queueStateStyles[state],
      )}
    >
      {queueStateLabels[state]}
    </span>
  );
}

/** The mini reception-queue board inside the browser frame. */
function HeroQueueMock({ tick }: { tick: number }) {
  // Rotate the queue by the tick; rows re-order with a transform transition.
  const rows = useMemo(() => {
    const offset = tick % heroQueue.length;
    return [...heroQueue.slice(offset), ...heroQueue.slice(0, offset)].map(
      (row, index) => ({
        ...row,
        // The top row advances to "In consultation", the next becomes the
        // one now serving; everything shifts one step down the flow.
        state:
          index === 0
            ? ("in-consultation" as QueueState)
            : index === 1
              ? ("in-queue" as QueueState)
              : index === heroQueue.length - 1
                ? ("completed" as QueueState)
                : ("waiting" as QueueState),
        key: `${row.token}-${tick}`,
      }),
    );
  }, [tick]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-warning/70" />
        <span className="size-2.5 rounded-full bg-success/70" />
        <span className="ml-3 flex-1 truncate rounded-md bg-muted px-2 py-1 text-2xs text-muted-foreground">
          myopd.app / reception / queue
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Reception queue</p>
            <p className="text-2xs text-muted-foreground">
              Live tokens &middot; demo board
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-2xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Live
          </span>
        </div>

        <ul className="mt-4 space-y-2">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5 transition-transform duration-500 ease-out"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-semibold text-primary">
                {row.token}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {row.patient}
                </span>
                <span className="block text-2xs text-muted-foreground">
                  {row.doctor}
                </span>
              </span>
              <QueueChip state={row.state} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function NowServingCard({ token }: { token: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur">
      <span className="lp-pulse-ring relative flex size-10 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">
        {token.replace("T-", "")}
      </span>
      <div>
        <p className="text-2xs uppercase tracking-wide text-muted-foreground">
          Now serving
        </p>
        <p className="font-mono text-sm font-semibold">{token}</p>
      </div>
    </div>
  );
}

function MiniPrescriptionCard() {
  return (
    <div className="w-48 rounded-2xl border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ClipboardList className="size-3.5" />
        </span>
        <p className="text-xs font-semibold">Prescription</p>
      </div>
      <div className="mt-2.5 space-y-1.5">
        <p className="truncate rounded bg-muted/60 px-2 py-1 text-2xs">
          Tab Azithro 500 · 1-0-0 · 3d
        </p>
        <p className="truncate rounded bg-muted/60 px-2 py-1 text-2xs">
          Syp Cetirizine · 0-0-1 · 5d
        </p>
      </div>
      <p className="mt-2.5 border-t border-dashed border-border pt-2 text-right font-serif text-2xs italic text-muted-foreground">
        Dr. Rao
      </p>
    </div>
  );
}

function BillPaidChip() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-3.5 py-2 shadow-xl backdrop-blur">
      <span className="flex size-5 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-3.5" />
      </span>
      <p className="text-xs font-medium">Bill paid ₹650</p>
    </div>
  );
}

// ─── Schedule calendar (floating card, kept from the old hero) ──

function ScheduleCalendar() {
  return (
    <Card className="gap-0 rounded-2xl border border-border/70 bg-card/80 shadow-lg shadow-foreground/5 backdrop-blur">
      <CardHeader className="rounded-t-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="grid gap-1">
            <CardTitle className="text-base">Doctor schedule</CardTitle>
            <CardDescription>
              March 2026 &middot; demo data
            </CardDescription>
          </div>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarClock className="size-4" />
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-xl border border-border bg-border">
          <div className="grid grid-cols-7 gap-px text-center text-[0.7rem] font-medium uppercase tracking-wide">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div
                key={`${day}-${index}`}
                className={cn(
                  "bg-card/80 py-1.5",
                  index === 0 && "rounded-tl-xl",
                  index === 6 && "rounded-tr-xl",
                )}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="mt-px flex flex-col gap-px text-center text-xs">
            {calendarWeeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-px">
                {week.map((day, dayIndex) => {
                  const isSelected = day === calendarSelectedDay;
                  const isBooked = day !== null && calendarBookings.has(day);
                  const isClosed = day !== null && calendarClosedDays.has(day);
                  return (
                    <div
                      key={day ?? `${weekIndex}-${dayIndex}`}
                      className="flex h-7 cursor-default flex-col items-center justify-center bg-card/80"
                    >
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full tabular-nums",
                          isSelected && "bg-primary font-semibold text-primary-foreground",
                          isBooked && !isSelected && "font-medium text-foreground",
                          isClosed && "text-muted-foreground/50 line-through",
                          day === null && "text-transparent",
                        )}
                      >
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Feature ticker ────────────────────────────────────────────

function FeatureTicker() {
  return (
    <div
      className="group [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      aria-hidden="true"
    >
      <div className="flex w-max lp-marquee group-hover:lp-marquee-paused motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center gap-8 py-3 pr-8"
          >
            {tickerModules.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm whitespace-nowrap text-muted-foreground"
              >
                <Icon className="size-4 text-primary" />
                {label}
                <span
                  aria-hidden="true"
                  className="ml-6 size-1 rounded-full bg-border"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

// ─── Features (bento grid) ─────────────────────────────────────

function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-16 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Modules"
          title="One platform for the entire clinic"
          lead="Every module shares the same patient and visit record — register once and the data carries through appointments, consultation, billing, and pharmacy."
        />
      </div>

      {/* Marquee sits directly under the hero, edge-faded, pauses on hover */}
      <div className="mt-10 border-y border-border/60 bg-muted/40">
        <FeatureTicker />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mt-14 grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-6">
          {bentoTiles.map((tile, index) => (
            <Reveal
              key={tile.title}
              delay={index * 80}
              className={tile.span}
            >
              <BentoTile tile={tile} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Radial spotlight that follows the cursor via --x/--y custom properties. */
function SpotlightCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--x",
          `${event.clientX - rect.left}px`,
        );
        event.currentTarget.style.setProperty(
          "--y",
          `${event.clientY - rect.top}px`,
        );
      }}
      className={cn(
        "group/tile relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(360px circle at var(--x, 50%) var(--y, 50%), color-mix(in oklch, var(--color-primary) 8%, transparent), transparent 70%)",
      }}
    >
      {children}
    </div>
  );
}

function BentoTileVisual({ kind }: { kind: (typeof bentoTiles)[number]["kind"] }) {
  if (kind === "queue") return <QueueBoardVisual />;
  if (kind === "slots") return <SlotsVisual />;
  if (kind === "rx") return <RxLinesVisual />;
  if (kind === "billing") return <BillCountUpVisual />;
  return <ReportsSparkline />;
}

function BentoTile({ tile }: { tile: (typeof bentoTiles)[number] }) {
  return (
    <SpotlightCard className="flex h-full flex-col">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <tile.icon className="size-4.5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold">{tile.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {tile.description}
      </p>
      <div className="mt-auto pt-4">
        <BentoTileVisual kind={tile.kind} />
      </div>
    </SpotlightCard>
  );
}

/** Tokens sliding up every 2.2s while visible. */
function QueueBoardVisual() {
  const tokens = ["T-011", "T-012", "T-013", "T-014", "T-015"];
  const [tick, setTick] = useState(0);
  // The interval only runs while the board is on screen and the tab visible.
  const setRef = useIntervalWhenVisible(
    () => setTick((t) => t + 1),
    2200,
  );
  const reducedMotion = usePrefersReducedMotion();

  const offset = reducedMotion ? 0 : tick % tokens.length;
  const ordered = [
    ...tokens.slice(offset),
    ...tokens.slice(0, offset),
  ];

  return (
    <div
      ref={setRef}
      className="rounded-xl border border-border bg-muted/40 p-3"
    >
      <p className="text-2xs uppercase tracking-wide text-muted-foreground">
        Now serving
      </p>
      <ul className="mt-2 space-y-1.5">
        {ordered.map((token, index) => (
          <li
            key={token}
            className={cn(
              "flex items-center justify-between rounded-lg px-2.5 py-1.5 font-mono text-xs transition-all duration-500",
              index === 0
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-background text-muted-foreground",
            )}
          >
            {token}
            <span className="text-2xs">{index === 0 ? "In consult" : "Waiting"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Slot chips — free ones highlight on hover. */
function SlotsVisual() {
  const slots = [
    { time: "09:00", booked: true },
    { time: "09:30", booked: false },
    { time: "10:00", booked: true },
    { time: "10:30", booked: false },
    { time: "11:00", booked: true },
    { time: "11:30", booked: false },
    { time: "12:00", booked: true },
    { time: "12:30", booked: false },
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {slots.map((slot) => (
        <span
          key={slot.time}
          tabIndex={0}
          className={cn(
            "cursor-default rounded-md border px-1 py-1.5 text-center text-2xs tabular-nums transition-colors",
            slot.booked
              ? "border-border bg-muted text-muted-foreground line-through opacity-60"
              : "border-primary/30 bg-primary/5 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:border-primary focus-visible:bg-primary focus-visible:text-primary-foreground",
          )}
        >
          {slot.time}
        </span>
      ))}
    </div>
  );
}

/** Rx lines type in with a staggered fade when the tile scrolls into view. */
function RxLinesVisual() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const lines = [
    "Tab Azithro 500 — 1-0-0 · 3 days",
    "Syp Cetirizine — 0-0-1 · 5 days",
    "Tab Paracetamol — SOS",
  ];
  return (
    <div ref={ref} className="space-y-1.5 font-mono text-2xs">
      {lines.map((line, index) => (
        <p
          key={line}
          className={cn(
            "truncate rounded bg-muted/60 px-2 py-1 transition-[opacity,translate] duration-500 ease-out motion-reduce:transition-none",
            inView ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          )}
          style={{ transitionDelay: inView ? `${index * 250}ms` : "0ms" }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

/** Bill total counts up from 0, once, when in view. */
function BillCountUpVisual() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reducedMotion = usePrefersReducedMotion();
  const [amount, setAmount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    if (reducedMotion) {
      setAmount(650);
      return;
    }
    const durationMs = 1200;
    const start = performance.now();
    let frame: number;
    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAmount(Math.round(650 * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, reducedMotion]);

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-2xs uppercase tracking-wide text-muted-foreground">
          Invoice total
        </p>
        <p className="font-mono text-lg font-semibold tabular-nums">
          ₹{amount}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-between text-2xs text-muted-foreground">
        <span>Consultation ₹300</span>
        <span>Medicines ₹350</span>
      </div>
      <div
        ref={ref}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-out"
          style={{ width: inView ? "100%" : "0%" }}
        />
      </div>
    </div>
  );
}

/** Static demo sparkline in the sequential viz color. */
function ReportsSparkline() {
  const data = useMemo(
    () => [12, 18, 14, 22, 19, 26, 24, 31, 28, 35, 33, 40].map((v, i) => ({ i, v })),
    [],
  );
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between">
        <p className="text-2xs uppercase tracking-wide text-muted-foreground">
          Revenue trend
        </p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-2xs text-muted-foreground">
          Demo data
        </span>
      </div>
      <div className="mt-2 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="lp-spark-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--viz-sequential)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--viz-sequential)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <YAxis hide domain={[0, "dataMax"]} />
            <Area
              type="monotone"
              dataKey="v"
              stroke="var(--viz-sequential)"
              strokeWidth={2}
              fill="url(#lp-spark-fill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Workflow ──────────────────────────────────────────────────

const workflowAutoAdvanceMs = 1800;

function WorkflowSection() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reducedMotion = usePrefersReducedMotion();
  const [pinned, setPinned] = useState<number | null>(null);
  const [autoStep, setAutoStep] = useState(0);
  // Read inside the interval callback (via ref) so a pinned step pauses the
  // auto-advance without re-creating the interval.
  const pinnedRef = useRef<number | null>(null);
  pinnedRef.current = pinned;

  // Line fill animates 0→100% when the section scrolls into view.
  const lineFilled = inView || reducedMotion;

  // Auto-highlight advances every 1.8s while the section is on screen and
  // the tab visible; a pinned (hovered/focused) step pauses the auto-advance
  // and reduced motion shows every step filled instead.
  const setSectionRef = useIntervalWhenVisible(
    () => {
      if (pinnedRef.current === null) {
        setAutoStep((step) => (step + 1) % workflowSteps.length);
      }
    },
    workflowAutoAdvanceMs,
  );

  const highlighted = pinned ?? autoStep;

  return (
    <section
      id="workflow"
      className="scroll-mt-16 bg-muted/40 py-24 md:py-32"
    >
      {/* soft top/bottom fade so sections separate without hard borders */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -mt-24 h-24 bg-gradient-to-b from-background to-transparent"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it flows"
          title="One visit, one record, six steps"
          lead="Booking reserves a slot — checking in is what puts the patient on the token queue. From there the same record follows them all the way to the pharmacy."
        />

        <div
          ref={(node) => {
            // Feed both the fill-observer and the interval visibility gate.
            ref.current = node;
            setSectionRef(node);
          }}
          className="relative mt-16"
        >
          {/* Connecting line — scaleX on md+, scaleY on mobile */}
          {/* (the interval ref lives here so auto-advance only runs on screen) */}
          <div
            aria-hidden="true"
            className="absolute top-5 right-0 left-0 hidden h-0.5 origin-left rounded-full bg-border md:block"
          >
            <div
              className="h-full rounded-full bg-primary transition-transform duration-1000 ease-out motion-reduce:hidden"
              style={{
                transform: `scaleX(${lineFilled ? 1 : 0})`,
              }}
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-5 w-0.5 origin-top rounded-full bg-border md:hidden"
          >
            <div
              className="h-full w-full rounded-full bg-primary transition-transform duration-1000 ease-out motion-reduce:hidden"
              style={{
                transform: `scaleY(${lineFilled ? 1 : 0})`,
              }}
            />
          </div>

          <ol className="grid gap-10 md:grid-cols-6 md:gap-4">
            {workflowSteps.map((step, index) => {
              const isHighlighted = highlighted === index;
              // With reduced motion every step shows already filled.
              const isReached = reducedMotion || (lineFilled && index <= 5);
              return (
                <li
                  key={step.label}
                  className="relative"
                >
                  <button
                    type="button"
                    aria-pressed={isHighlighted}
                    onMouseEnter={() => setPinned(index)}
                    onMouseLeave={() => setPinned(null)}
                    onFocus={() => setPinned(index)}
                    onBlur={() => setPinned(null)}
                    onClick={() =>
                      setPinned((current) =>
                        current === index ? null : index,
                      )
                    }
                    className="group flex w-full items-start gap-4 rounded-xl p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 md:flex-col md:items-start md:gap-3 md:p-0"
                  >
                    <span
                      className={cn(
                        "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-background font-mono text-xs font-semibold transition-colors duration-500",
                        isReached || isHighlighted
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground",
                        isHighlighted && "shadow-md shadow-primary/30",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <step.icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            isHighlighted ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                        <span className="text-sm font-semibold">
                          {step.label}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground md:line-clamp-2">
                        {step.description}
                      </span>
                    </span>
                  </button>

                  {/* Detail card — shown when pinned/hovered/focused */}
                  {isHighlighted && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 mt-3 rounded-lg border border-border bg-popover px-3 py-2 text-2xs shadow-md duration-200">
                      <p className="font-medium text-popover-foreground">
                        Handled by {step.role}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ─── Roles (About + Capabilities merged) ───────────────────────

function RolesSection() {
  return (
    <section
      id="about"
      className="relative scroll-mt-16 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="For your team"
          title="One system, a screen for every role"
          lead="Admins, doctors, reception and patients each get a workspace shaped around their part of the visit — same record, four points of view."
        />

        <Reveal delay={120}>
          <Tabs defaultValue={roleTabs[0].value} className="mt-12">
            <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-auto">
              {roleTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="px-4 py-2">
                  <tab.icon data-icon="inline-start" className="size-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {roleTabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="mt-8 min-h-[22rem] focus-visible:outline-none"
              >
                {/* Keyed cross-fade: remounts on tab switch so the
                    animate-in classes replay. */}
                <div
                  key={tab.value}
                  className="animate-in fade-in slide-in-from-right-4 grid gap-10 duration-300 lg:grid-cols-2 lg:gap-16"
                >
                  <ul className="space-y-4">
                    {tab.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{bullet}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <RolePanel kind={tab.panel} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Reveal>

        {/* Principle cards */}
        <div className="mt-20 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {principles.map((principle, index) => (
            <Reveal key={principle.title} delay={index * 80}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <principle.icon className="size-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">
                  {principle.title}
                </h3>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Small styled mock panel per role. */
function RolePanel({ kind }: { kind: (typeof roleTabs)[number]["panel"] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      {kind === "admin" && <AdminPanel />}
      {kind === "doctor" && <DoctorPanel />}
      {kind === "reception" && <ReceptionPanel />}
      {kind === "patient" && <PatientPanel />}
    </div>
  );
}

function PanelHeader({
  title,
  icon: Icon,
}: {
  title: string;
  icon: typeof Building2;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <p className="text-sm font-semibold">{title}</p>
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </span>
    </div>
  );
}

function AdminPanel() {
  return (
    <div>
      <PanelHeader title="Organisation" icon={Building2} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        {["Doctors & shifts", "Medicine catalog", "Roles", "Reports"].map(
          (item) => (
            <div
              key={item}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-medium"
            >
              {item}
            </div>
          ),
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-2xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0 text-primary" />
        Permissions scoped per role
      </div>
    </div>
  );
}

function DoctorPanel() {
  return (
    <div>
      <PanelHeader title="Consult workspace" icon={Stethoscope} />
      <ul className="mt-4 space-y-2">
        {[
          { name: "A. Sharma", note: "Follow-up · BP review" },
          { name: "R. Menon", note: "New visit · fever" },
          { name: "S. Khan", note: "New visit · cough" },
        ].map((patient) => (
          <li
            key={patient.name}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
          >
            <div>
              <p className="text-xs font-medium">{patient.name}</p>
              <p className="text-2xs text-muted-foreground">{patient.note}</p>
            </div>
            <Eye className="size-3.5 text-muted-foreground" />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-2xs text-primary">
        <FileText className="size-3.5 shrink-0" />
        Rx templates & printable PDF
      </div>
    </div>
  );
}

function ReceptionPanel() {
  return (
    <div>
      <PanelHeader title="Front desk" icon={ClipboardList} />
      <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <span className="text-xs font-medium">Queue length</span>
        <span className="font-mono text-xs text-primary">4 waiting</span>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <span className="text-xs font-medium">Next token</span>
        <span className="font-mono text-xs">T-015</span>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <span className="text-xs font-medium">Today&rsquo;s slips</span>
        <span className="font-mono text-xs">18 printed</span>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-2xs text-muted-foreground">
        <Receipt className="size-3.5 shrink-0 text-primary" />
        Check-in → token → billing in one screen
      </div>
    </div>
  );
}

function PatientPanel() {
  return (
    <div>
      <PanelHeader title="My health" icon={User} />
      <div className="mt-4 flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
        <CalendarClock className="size-4 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-medium">Next appointment</p>
          <p className="text-2xs text-muted-foreground">
            Thu 12 Mar · 10:15 · Dr. Rao
          </p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Bills", icon: Receipt },
          { label: "Lab orders", icon: FlaskConical },
          { label: "Rx", icon: FileText },
        ].map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="rounded-lg border border-border py-3 text-2xs font-medium text-muted-foreground"
          >
            <Icon className="mx-auto mb-1 size-4 text-primary" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CTA band ──────────────────────────────────────────────────

function CtaBand() {
  return (
    <section className="relative overflow-hidden py-6">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-emerald-500 px-6 py-16 text-center sm:px-16">
            {/* animated grain/blob */}
            <div
              aria-hidden="true"
              className="lp-blob pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-white/15 opacity-30 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="lp-blob pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-emerald-300/25 opacity-30 blur-2xl [animation-delay:-9s]"
            />

            <h2 className="relative text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Run your OPD without the paperwork.
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-white/85">
              Set up the clinic once — registration, queue, consultation,
              billing and pharmacy share one record from the first visit.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                <Link to="/register">
                  Set up your clinic
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link to="/display">
                  <Monitor className="size-4" />
                  Open waiting-room display
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Contact ───────────────────────────────────────────────────

function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-16 bg-muted/40 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Contact"
          title="Talk to someone who knows the workflow"
          lead="Questions about migration, pricing, or how a specific module fits your clinic — reach out and we will walk through it."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: channels */}
          <div className="space-y-6">
            {contactChannels.map((channel) => (
              <Reveal key={channel.title}>
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <channel.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{channel.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {channel.description}
                    </p>
                    <a
                      href={channel.href}
                      className="mt-2 inline-block text-sm font-medium text-primary transition-colors hover:underline"
                    >
                      {channel.action}
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}

            <Reveal delay={100}>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-primary" />
                Made for clinics in India
              </div>
            </Reveal>
          </div>

          {/* Right: form */}
          <Reveal delay={150}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", clinic: "", phone: "", message: "" },
  });

  const onSubmit = form.handleSubmit(() => {
    // Front-end demo only — no backend call.
    toast("Thanks! We'll get back to you.", {
      description: "Our team replies within one business day.",
    });
    form.reset();
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <ContactField
            form={form}
            name="name"
            label="Your name"
            placeholder="Dr. Meera Patel"
          />
          <ContactField
            form={form}
            name="clinic"
            label="Clinic name"
            placeholder="Sunrise Family Clinic"
          />
        </div>

        <ContactField
          form={form}
          name="phone"
          label="Phone"
          placeholder="+91 98765 43210"
          inputMode="tel"
        />

        <Field>
          <FieldLabel htmlFor="contact-message">Message</FieldLabel>
          {/* Plain textarea — the UI kit ships no Textarea wrapper. */}
          <textarea
            id="contact-message"
            placeholder="Tell us how your OPD runs today…"
            rows={4}
            className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
            {...form.register("message")}
          />
          <FieldError errors={[form.formState.errors.message]} />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={form.formState.isSubmitting}
        >
          Send message
          <ArrowRight className="size-4" />
        </Button>
      </FieldGroup>
    </form>
  );
}

function ContactField({
  form,
  name,
  label,
  placeholder,
  inputMode,
}: {
  form: {
    register: ReturnType<typeof useForm<ContactFormValues>>["register"];
    formState: ReturnType<
      typeof useForm<ContactFormValues>
    >["formState"];
  };
  name: keyof ContactFormValues;
  label: string;
  placeholder: string;
  inputMode?: "tel" | "text";
}) {
  const error = form.formState.errors[name];
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={`contact-${name}`}>{label}</FieldLabel>
      <Input
        id={`contact-${name}`}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        {...form.register(name)}
      />
      <FieldError errors={[error]} />
    </Field>
  );
}

// ─── Footer ────────────────────────────────────────────────────

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      to={href}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function Footer() {
  const productLinks = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#workflow" },
    { label: "For your team", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];
  const accessLinks = [
    { label: "Sign in", href: "/login" },
    { label: "Set up your clinic", href: "/register" },
    { label: "Waiting-room display", href: "/display" },
    { label: "Help", href: "/help" },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Hospital className="size-4" />
              </span>
              <span className="text-sm font-semibold">MyOPD</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Registration to pharmacy dispensing — one system, one record,
              every step of the visit.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-4 space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Access</h4>
            <ul className="mt-4 space-y-2">
              {accessLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Contact</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="mailto:sales@myopd.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  sales@myopd.com
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@myopd.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  support@myopd.com
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact form
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} MyOPD.</span>
          <span>Made for clinics in India</span>
        </div>
      </div>
    </footer>
  );
}
