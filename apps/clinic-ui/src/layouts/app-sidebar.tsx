import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Building2,
  CalendarClock,
  ClipboardList,
  Cpu,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Package,
  Pill,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  User,
  UserCog,
  Users,
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

const clinicNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/queue", label: "Queue", icon: ListOrdered },
  { to: "/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/prescriptions", label: "Prescriptions", icon: ClipboardList },
] as const;

const pharmacyNav = [
  { to: "/pos", label: "Point of Sale", icon: ShoppingCart },
  { to: "/medicine-catalog", label: "Medicine Catalog", icon: Pill },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/dispensing", label: "Dispensing", icon: Package },
] as const;

const devNav = [
  { to: "/development", label: "Overview", icon: Cpu },
  { to: "/development/modules", label: "Application Modules", icon: Box },
  { to: "/development/features", label: "Application Features", icon: Zap },
] as const;

const orgNav = [
  { to: "/organisation", label: "Overview", icon: Building2 },
  { to: "/organisation/users", label: "Users", icon: UserCog },
  { to: "/organisation/roles", label: "Roles & Permissions", icon: ShieldCheck },
] as const;

export function AppSidebar() {
  const matchRoute = useMatchRoute();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

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
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Stethoscope className="size-4" />
                </span>
                <span className="min-w-0 truncate text-sm font-semibold">OPD ERP</span>
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
        <SidebarGroup>
          <SidebarGroupLabel>Organisation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {orgNav.map((item) => (
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
          <SidebarGroupLabel>Development</SidebarGroupLabel>
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-6">
                    <AvatarFallback>{initials(user?.name ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col text-left">
                    <span className="truncate text-sm font-medium">{user?.name ?? "Guest"}</span>
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
