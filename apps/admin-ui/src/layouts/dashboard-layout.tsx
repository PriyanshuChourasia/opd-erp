import { useState } from "react";
import { Outlet, useMatches, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "./app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
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
import { LogOut, User } from "lucide-react";

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

export function DashboardLayout() {
  const matches = useMatches();
  const navigate = useNavigate();
  const [user] = useState(getUser);

  const title =
    [...matches]
      .reverse()
      .map(
        (match) =>
          (match.staticData as { title?: string } | undefined)?.title,
      )
      .find(Boolean) ?? "Dashboard";

  const handleLogout = () => {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");
    navigate({ to: "/", replace: true });
  };

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
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback>
                        {initials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" className="w-56">
                  <DropdownMenuLabel>
                    {user
                      ? `${user.firstName} ${user.lastName}`
                      : "Guest"}
                    <p className="text-xs font-normal text-muted-foreground">
                      {user?.roleName ?? ""}
                    </p>
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
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
