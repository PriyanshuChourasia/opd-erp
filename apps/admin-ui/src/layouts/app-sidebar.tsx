import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  UserCog,
  Users,
} from "lucide-react";
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

const NAV_ITEMS = [
  {
    group: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Management",
    items: [
      { to: "/users", label: "Users", icon: Users },
      { to: "/roles", label: "Roles & Permissions", icon: ShieldCheck },
      { to: "/organisations", label: "Organisations", icon: Building2 },
    ],
  },
  {
    group: "Content",
    items: [
      { to: "/modules", label: "Modules", icon: FileText },
      { to: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    group: "Account",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/profile", label: "Profile", icon: User },
    ],
  },
];

function getUser() {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function initials(firstName?: string, lastName?: string) {
  return `${(firstName ?? "?").charAt(0)}${(lastName ?? "?").charAt(0)}`.toUpperCase();
}

export function AppSidebar() {
  const matchRoute = useMatchRoute();
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");
    navigate({ to: "/" });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                  A
                </span>
                <span className="min-w-0 truncate text-sm font-semibold">
                  Admin Panel
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_ITEMS.map(({ group, items }) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={!!matchRoute({ to: item.to })}
                      tooltip={item.label}
                    >
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
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-6">
                    <AvatarFallback>
                      {initials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col text-left">
                    <span className="truncate text-sm font-medium">
                      {user?.firstName ?? ""} {user?.lastName ?? "Guest"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email ?? "Not signed in"}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>
                  {user?.roleName ?? "Admin"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/profile">
                    <User />
                    Profile
                  </a>
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
