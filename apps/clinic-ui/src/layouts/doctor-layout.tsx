import { Link, Outlet, useMatchRoute, useNavigate } from "@tanstack/react-router";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Pill,
  Stethoscope,
  User,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { clearCredentials } from "@/store/auth-slice";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const doctorNav = [
  { to: "/doctor", label: "My Patients", icon: LayoutDashboard },
  { to: "/doctor/prescriptions", label: "Prescriptions", icon: ClipboardList },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DoctorLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-background lg:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Link to="/doctor" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="size-4" />
            </span>
            <span className="text-sm font-semibold">Doctor</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {doctorNav.map((item) => {
            const active = item.to === "/doctor"
              ? !!matchRoute({ to: item.to, fuzzy: false })
              : !!matchRoute({ to: item.to });
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  active && "bg-muted text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0 text-muted-foreground" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
                <Avatar className="size-6">
                  <AvatarFallback>{initials(user?.firstName ?? "?")}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 truncate font-medium">{user?.firstName ?? ""} {user?.lastName ?? ""}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>{user?.roleName ?? "No role"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/doctor/profile"><User />Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}><LogOut />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 lg:hidden">
          <Link to="/doctor" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="size-4" />
            </span>
            <span className="text-sm font-semibold">Doctor</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex items-center gap-2 rounded-md p-1 hover:bg-muted">
                <Avatar className="size-6">
                  <AvatarFallback>{initials(user?.firstName ?? "?")}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56">
              <DropdownMenuLabel>{user?.roleName ?? "No role"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/doctor/profile"><User />Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}><LogOut />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
