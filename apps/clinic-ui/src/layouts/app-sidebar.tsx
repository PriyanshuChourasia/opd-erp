import { useMemo } from "react";
import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCompany } from "@/lib/api";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Box,
  Building2,
  CalendarClock,
  ClipboardList,
  Clock,
  Cpu,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Package,
  Pill,
  Receipt,
  Settings,
  ShieldCheck,
  Stethoscope,
  User,
  UserCog,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { clearCredentials } from "@/store/auth-slice";
import { useAppSelector } from "@/store/hooks";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { HelpLink } from "@/modules/help/components/help-link";
import { BrandMark } from "@/components/brand-mark";
import { fetchMySidebarConfig } from "@/lib/api";

/** Map of icon name strings → Lucide components. */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity, AlertCircle, BarChart3, Box, Building2, CalendarClock, ClipboardList,
  Clock, Cpu, FileText, LayoutDashboard, LifeBuoy, MapPin, Package,
  Pill, Receipt, Settings, ShieldCheck, Stethoscope, User, UserCog, Users, Wallet, Zap,
};

/** Hardcoded fallback menu (used when sidebar config is empty / not seeded yet). */
const FALLBACK_NAV: Record<string, { to: string; label: string; icon: string }[]> = {
  Clinic: [
    { to: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { to: "/appointments", label: "Appointments", icon: "CalendarClock" },
    { to: "/patients", label: "Patients", icon: "Users" },
    { to: "/doctors", label: "Doctors", icon: "UserCog" },
    { to: "/prescriptions", label: "Prescriptions", icon: "ClipboardList" },
    { to: "/diagnoses", label: "Diagnoses", icon: "Stethoscope" },
  ],
  "OPD Reports": [
    { to: "/reports/daily-opd-summary", label: "Daily OPD Summary", icon: "Activity" },
    { to: "/reports/doctor-wise-opd", label: "Doctor-wise OPD", icon: "Stethoscope" },
    { to: "/reports/revenue-collection", label: "Revenue / Collection", icon: "Wallet" },
    { to: "/reports/outstanding-payments", label: "Outstanding Payments", icon: "AlertCircle" },
  ],
  "Pharmacy & Billing": [
    { to: "/medicine-catalog", label: "Medicine Catalog", icon: "Pill" },
    { to: "/billing", label: "Billing", icon: "Receipt" },
    { to: "/dispensing", label: "Dispensing", icon: "Package" },
  ],
  Organisation: [
    { to: "/organisation", label: "Overview", icon: "Building2" },
    { to: "/organisation/prescription-templates", label: "Rx Templates", icon: "FileText" },
    { to: "/shifts", label: "Shifts", icon: "Clock" },
    { to: "/addresses", label: "Addresses", icon: "MapPin" },
    { to: "/organisation/departments", label: "Departments", icon: "Building2" },
    { to: "/organisation/designations", label: "Designations", icon: "UserCog" },
    { to: "/organisation/financial-years", label: "Financial Years", icon: "CalendarClock" },
    { to: "/organisation/users", label: "Users", icon: "UserCog" },
    { to: "/organisation/sidebar-config", label: "Sidebar Config", icon: "Settings" },
  ],
  "Access Control": [
    { to: "/organisation/roles", label: "Roles & Permissions", icon: "ShieldCheck" },
  ],
  Developer: [
    { to: "/developer", label: "Overview", icon: "Cpu" },
    { to: "/developer/modules", label: "Modules", icon: "Box" },
    { to: "/developer/features", label: "Features", icon: "Zap" },
  ],
  Account: [
    { to: "/profile", label: "Profile", icon: "User" },
    { to: "/settings", label: "Settings", icon: "Settings" },
    { to: "/help", label: "Help", icon: "LifeBuoy" },
  ],
};

/** Group order for deterministic sidebar rendering. */
const GROUP_ORDER = [
  "Clinic", "OPD Reports", "Pharmacy & Billing", "Organisation",
  "Access Control", "Developer", "Account",
];

export function AppSidebar() {
  const matchRoute = useMatchRoute();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  // Fetch sidebar config from API
  const { data: menuConfig = [] } = useQuery({
    queryKey: ["sidebar-config", "my"],
    queryFn: fetchMySidebarConfig,
    staleTime: 5 * 60 * 1000, // cache for 5 min
    enabled: !!user,
  });

  // Fetch organisation/company name for sidebar header
  const { data: organisation } = useQuery({
    queryKey: ["company"],
    queryFn: fetchCompany,
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  // Build the sidebar menu from config (filtered by user's role)
  const sidebarGroups = useMemo(() => {
    if (!user) return [];

    // If no config seeded yet, use fallback
    if (menuConfig.length === 0) {
      return GROUP_ORDER.map((group) => ({
        group,
        items: (FALLBACK_NAV[group] ?? []).map((item) => ({
          to: item.to,
          label: item.label,
          icon: item.icon,
        })),
      })).filter((g) => g.items.length > 0);
    }

    // /sidebar-config/my already returns only items for the user's role
    const grouped: Record<string, typeof menuConfig> = {};
    for (const item of menuConfig) {
      if (!grouped[item.group]) grouped[item.group] = [];
      grouped[item.group]!.push(item);
    }

    return GROUP_ORDER
      .filter((g) => grouped[g]?.length)
      .map((group) => ({
        group,
        items: grouped[group]!
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            to: item.path,
            label: item.label,
            icon: item.icon ?? "",
          })),
      }));
  }, [menuConfig, user]);

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate({ to: "/login" });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <BrandMark />
                <span className="min-w-0 truncate text-sm font-semibold">
                  {organisation?.name || "MyClinic"}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sidebarGroups.map(({ group, items }) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
                  const isHelp = item.to === "/help";
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={!!matchRoute({ to: item.to })}
                        tooltip={item.label}
                      >
                        {isHelp ? (
                          <HelpLink>
                            <Icon />
                            <span>{item.label}</span>
                          </HelpLink>
                        ) : (
                          <Link to={item.to}>
                            <Icon />
                            <span>{item.label}</span>
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-6">
                    <AvatarFallback>{initials(user?.firstName ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col text-left">
                    <span className="truncate text-sm font-medium">{user?.firstName ?? ""} {user?.lastName ?? "Guest"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email ?? "Not signed in"}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
