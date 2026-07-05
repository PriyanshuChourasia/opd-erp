import { Plus, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

const users = [
  { id: "1", name: "Dr. Sarah Chen", email: "sarah.chen@citycare.com", role: "Doctor", status: "active" },
  { id: "2", name: "John Smith", email: "john.smith@citycare.com", role: "Receptionist", status: "active" },
  { id: "3", name: "Admin User", email: "admin@citycare.com", role: "Admin", status: "active" },
  { id: "4", name: "Nurse Emily Davis", email: "emily.davis@citycare.com", role: "Nurse", status: "active" },
  { id: "5", name: "Mike Johnson", email: "mike.j@citycare.com", role: "Pharmacist", status: "active" },
  { id: "6", name: "Lisa Wong", email: "lisa.wong@citycare.com", role: "Doctor", status: "inactive" },
  { id: "7", name: "Alex Rivera", email: "alex.rivera@citycare.com", role: "Receptionist", status: "invited" },
  { id: "8", name: "Dr. James Park", email: "james.park@citycare.com", role: "Doctor", status: "active" },
];

const roleBadgeVariant: Record<string, "secondary" | "outline" | "default"> = { Admin: "default", Doctor: "secondary", Nurse: "outline", Receptionist: "outline", Pharmacist: "secondary" };
const statusVariant: Record<string, "secondary" | "outline" | "default"> = { active: "default", inactive: "secondary", invited: "outline" };

export function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Users</h1><p className="mt-1 text-sm text-muted-foreground">Manage your team members and their access</p></div>
        <Button><Plus className="mr-2 size-4" />Invite User</Button>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search users by name or email..." className="pl-9" /></div><Button variant="outline">Filter</Button></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                <Avatar className="size-9"><AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                <Badge variant={roleBadgeVariant[user.role] ?? "outline"}>{user.role}</Badge>
                <Badge variant={statusVariant[user.status] ?? "outline"}>{user.status}</Badge>
                <Button variant="ghost" size="icon" className="size-8"><ShieldCheck className="size-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
