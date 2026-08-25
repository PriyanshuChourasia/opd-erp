import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Box,
  Building2,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Cpu,
  FlaskConical,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Package,
  Pill,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  User,
  UserCog,
  Users,
  UserX,
  Zap,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { clearCredentials } from "@/store/auth-slice";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/roles";
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

const clinicNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/doctors", label: "Doctors", icon: UserCog },
  { to: "/prescriptions", label: "Prescriptions", icon: ClipboardList },
  { to: "/diagnoses", label: "Diagnoses", icon: Stethoscope },
] as const;

const reportsNav = [
  { to: "/reports/revenue-by-category", label: "Revenue by Category", icon: BarChart3 },
  { to: "/reports/outstanding-bills", label: "Outstanding Bills", icon: AlertCircle },
  { to: "/reports/doctor-performance", label: "Doctor Performance", icon: UserCog },
  { to: "/reports/top-medicines", label: "Top Medicines", icon: Pill },
] as const;

const accountNav = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/help", label: "Help", icon: LifeBuoy },
] as const;

const pharmacyNav = [
  { to: "/medicine-catalog", label: "Medicine Catalog", icon: Pill },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/dispensing", label: "Dispensing", icon: Package },
] as const;

const devNav = [
  { to: "/developer", label: "Overview", icon: Cpu },
  { to: "/developer/modules", label: "Modules", icon: Box },
  { to: "/developer/features", label: "Features", icon: Zap },
] as const;

const orgNav = [
  { to: "/organisation", label: "Overview", icon: Building2, resource: "organisation" },
  { to: "/organisation/prescription-templates", label: "Rx Templates", icon: FileText, resource: "prescription-templates" },
  { to: "/shifts", label: "Shifts", icon: Clock, resource: "shifts" },
  { to: "/addresses", label: "Addresses", icon: MapPin, resource: "addresses" },
  { to: "/organisation/users", label: "Users", icon: UserCog, resource: "users" },
  { to: "/organisation/roles", label: "Roles & Permissions", icon: ShieldCheck, resource: "roles" },
] as const;

export function AppSidebar() {
  const matchRoute = useMatchRoute();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const visibleOrgNav = orgNav.filter((item) => hasPermission(user?.permissions, "read", item.resource));

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
                <span className="min-w-0 truncate text-sm font-semibold">MyClinic</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Clinic</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clinicNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={!!matchRoute({ to: item.to })} tooltip={item.label}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportsNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={!!matchRoute({ to: item.to })} tooltip={item.label}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Pharmacy &amp; Billing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pharmacyNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={!!matchRoute({ to: item.to })} tooltip={item.label}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {visibleOrgNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Organisation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleOrgNav.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={!!matchRoute({ to: item.to })} tooltip={item.label}>
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Developer</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {devNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={!!matchRoute({ to: item.to })} tooltip={item.label}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={!!matchRoute({ to: item.to })} tooltip={item.label}>
                    {item.to === "/help" ? (
                      <HelpLink>
                        <item.icon />
                        <span>{item.label}</span>
                      </HelpLink>
                    ) : (
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
