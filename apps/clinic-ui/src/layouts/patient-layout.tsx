import { useEffect } from "react";
import { Link, Outlet, useMatchRoute, useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Receipt,
  User,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { clearCredentials } from "@/store/auth-slice";
import { useAppSelector } from "@/store/hooks";
import { fetchProfile } from "@/lib/api";
import { initials } from "@/lib/utils";
import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandMark } from "@/components/brand-mark";

/** Patient nav items — used as fallback if sidebar config is empty */
const PATIENT_NAV = [
  { to: "/patient", label: "Dashboard", icon: "LayoutDashboard" },
  { to: "/patient/appointments", label: "Appointments", icon: "CalendarClock" },
  { to: "/patient/prescriptions", label: "Prescriptions", icon: "ClipboardList" },
  { to: "/patient/lab-orders", label: "Lab Reports", icon: "FlaskConical" },
  { to: "/patient/bills", label: "Bills", icon: "Receipt" },
] as const;

export function PatientLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate({ to: "/login" });
  };

  // Verify the JWT token is still valid
  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .catch(() => {
        if (cancelled) return;
        dispatch(clearCredentials());
        navigate({ to: "/login", replace: true });
      });
    return () => { cancelled = true; };
  }, [dispatch, navigate]);

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      {/* Mobile-style header with sidebar trigger */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <Link to="/patient" className="flex shrink-0 items-center gap-2">
          <BrandMark />
          <span className="text-sm font-semibold">Patient Portal</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="size-6">
                  <AvatarFallback>{initials(user?.firstName ?? "?")}</AvatarFallback>
                </Avatar>
                {user?.firstName ?? ""} {user?.lastName ?? "Guest"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56">
              <DropdownMenuLabel>{user?.roleName ?? "No role"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {/* Patient sidebar nav */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-56 flex-col border-r bg-background">
          <nav className="flex flex-col gap-1 p-2">
            {PATIENT_NAV.map((item) => {
              const iconMap: Record<string, typeof LayoutDashboard> = { LayoutDashboard, CalendarClock, ClipboardList, FlaskConical, Receipt };
              const Icon = iconMap[item.icon] ?? LayoutDashboard;
              const isActive = !!matchRoute({ to: item.to });
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
