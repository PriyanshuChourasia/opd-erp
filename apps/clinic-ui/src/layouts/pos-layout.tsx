import { Link, Outlet, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, LayoutDashboard, LogOut, Receipt, ShoppingCart, Stethoscope, User, Users } from "lucide-react";
import { useDispatch } from "react-redux";
import { clearCredentials } from "@/store/auth-slice";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";
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

const posNav = [
  { to: "/pos", label: "POS", icon: ShoppingCart },
  { to: "/pos/patients", label: "Patients", icon: Users },
  { to: "/pos/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/pos/billing", label: "Billing", icon: Receipt },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PosLayout() {
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
        <Link to="/pos" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="size-4" />
          </span>
          <span className="text-sm font-semibold">Point of Sale</span>
        </Link>
        <nav className="flex items-center gap-1">
          {posNav.map((item) => (
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
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <LayoutDashboard />
              Dashboard
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="size-6">
                  <AvatarFallback>{initials(user?.name ?? "?")}</AvatarFallback>
                </Avatar>
                {user?.name ?? "Guest"}
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
