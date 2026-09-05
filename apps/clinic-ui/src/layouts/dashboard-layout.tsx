import { useEffect } from "react";
import { Outlet, useNavigate, Link, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearCredentials } from "@/store/auth-slice";
import { setDateRange, selectDateRange } from "@/store/date-range-filter-slice";
import { fetchProfile, fetchFinancialYears } from "@/lib/api";
import { HelpTip } from "@/modules/help/components/help-tip";
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
import { CalendarClock, LogOut, User, ClipboardList, Plus } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FinancialYearSelect } from "@/components/ui/financial-year-select";
import { getHomeRoute } from "@/lib/roles";
import { cn } from "@/lib/utils";

function initials(firstName?: string, lastName?: string) {
  return `${(firstName ?? "?").charAt(0)}${(lastName ?? "").charAt(0)}`.toUpperCase();
}

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const dateRange = useAppSelector(selectDateRange);

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate({ to: "/login", replace: true });
  };

  // Verify the JWT token is still valid by fetching the user profile.
  // If the API returns an error (expired, revoked, server down), log out immediately.
  useEffect(() => {
    let cancelled = false;

    fetchProfile()
      .then(() => {
        // Profile fetched successfully — token is valid, nothing to do.
      })
      .catch(() => {
        if (cancelled) return;
        dispatch(clearCredentials());
        navigate({ to: "/login", replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate]);


  // Fetch current financial year
  const { data: fyResponse } = useQuery({
    queryKey: ["financial-years", "current"],
    queryFn: () => fetchFinancialYears({ limit: 100 }),
  });
  const financialYears = fyResponse?.data ?? [];

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider className="h-screen">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {(() => { const matchRoute = useMatchRoute(); return (
              <nav className="flex items-center gap-1">
                {[{ to: "/appointments/new" as const, label: "Quick Appointment", icon: Plus }, { to: "/appointments" as const, label: "Appointments", icon: CalendarClock }, { to: "/queue" as const, label: "Queue", icon: ClipboardList }].map((item) => {
                  const isActive = !!matchRoute({ to: item.to });
                  return (
                    <Link key={item.to} to={item.to} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors", isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            ); })()}
            <div className="ml-auto" />
            <FinancialYearSelect
              years={financialYears}
              value={dateRange.from || dateRange.to ? { from: dateRange.from ?? undefined, to: dateRange.to ?? undefined } : undefined}
              onChange={(range) => dispatch(setDateRange({ from: range.from, to: range.to }))}
            />
            <DateRangePicker
              value={dateRange.from || dateRange.to ? { from: dateRange.from ?? undefined, to: dateRange.to ?? undefined } : undefined}
              onChange={(range) => dispatch(setDateRange({ from: range.from ?? null, to: range.to ?? null }))}
            />
            <HelpTip />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback>{initials(user?.firstName, user?.lastName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56">
                <DropdownMenuLabel>
                  {user ? `${user.firstName} ${user.lastName}` : "Guest"}
                  <p className="text-xs font-normal text-muted-foreground">{user?.roleName ?? ""}</p>
                </DropdownMenuLabel>
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
          </header>
          <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
