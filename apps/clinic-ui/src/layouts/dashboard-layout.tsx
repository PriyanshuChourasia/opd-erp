import { useEffect } from "react";
import { Outlet, useMatches, useNavigate, Link } from "@tanstack/react-router";
import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearCredentials } from "@/store/auth-slice";
import { fetchProfile } from "@/lib/api";
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
import { LogOut, RefreshCw, User } from "lucide-react";
import { toast } from "sonner";

function initials(firstName?: string, lastName?: string) {
  return `${(firstName ?? "?").charAt(0)}${(lastName ?? "").charAt(0)}`.toUpperCase();
}

export function DashboardLayout() {
  const matches = useMatches();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

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
  const title =
    [...matches]
      .reverse()
      .map((match) => (match.staticData as { title?: string } | undefined)?.title)
      .find(Boolean) ?? "Dashboard";

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider className="h-screen">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={() => { fetchProfile().then((data) => { toast.success("State fetched", { description: `${data.firstName} ${data.lastName} — ${data.roleName}` }); }).catch(() => { toast.error("Failed to fetch state"); }); }}>
              <RefreshCw className="size-3.5" />
              FetchCurrentState
            </Button>
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
