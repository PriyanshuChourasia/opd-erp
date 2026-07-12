import { Link, Outlet, useMatchRoute, useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Receipt,
  Stethoscope,
  User,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { clearCredentials } from "@/store/auth-slice";
import { useAppSelector } from "@/store/hooks";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const patientNav = [
  { to: "/patient", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patient/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/patient/prescriptions", label: "Prescriptions", icon: ClipboardList },
  { to: "/patient/lab-orders", label: "Lab Reports", icon: FlaskConical },
  { to: "/patient/bills", label: "Bills", icon: Receipt },
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

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
        <Link to="/patient" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="size-4" />
          </span>
          <span className="text-sm font-semibold">Patient Portal</span>
        </Link>
        <nav className="flex items-center gap-1">
          {patientNav.map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              size="sm"
              className={cn(!!matchRoute({ to: item.to }) && "bg-muted text-foreground")}
              asChild
            >
              <Link to={item.to}>
                <item.icon />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
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
      <main className="flex flex-1 flex-col p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
