import { Link } from "@tanstack/react-router";
import { Building2, Globe, Mail, Phone, ShieldCheck, Users, Settings, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Total Users", value: "12", icon: Users },
  { label: "Active Roles", value: "5", icon: ShieldCheck },
  { label: "Departments", value: "6", icon: Building2 },
  { label: "Pending Invites", value: "3", icon: Activity },
];

const orgInfo = [
  { label: "Clinic Name", value: "City Care Medical Center" },
  { label: "Address", value: "123 Healthcare Blvd, Medical District" },
  { label: "Phone", value: "+1 (555) 123-4567" },
  { label: "Email", value: "admin@citycare.com" },
  { label: "Website", value: "www.citycare.com" },
  { label: "Registration No.", value: "MC-2024-00189" },
];

export function OrganisationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organisation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your clinic's settings, users, and permissions</p>
        </div>
        <Button variant="outline"><Settings className="mr-2 size-4" />Settings</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}><CardContent className="flex items-center gap-4 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-none bg-primary/10"><Icon className="size-5 text-primary" /></span>
            <div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-semibold">{value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="size-4" />Organisation Details</CardTitle><CardDescription>Key information about your clinic</CardDescription></CardHeader>
          <CardContent><dl className="space-y-3">{orgInfo.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>
          ))}</dl></CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base">Quick Actions</CardTitle><CardDescription>Manage your organisation</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {[{ icon: Users, label: "Manage Users", to: "/organisation/users" },
              { icon: ShieldCheck, label: "Roles & Permissions", to: "/organisation/roles" },
              { icon: Building2, label: "Departments & Branches", to: "/organisation" },
              { icon: Globe, label: "Clinic Profile & Branding", to: "/organisation" },
              { icon: Mail, label: "Email & Notification Settings", to: "/organisation" },
            ].map(({ icon: Icon, label, to }) => (
              <Button key={label} variant="outline" className="w-full justify-start gap-3" asChild><Link to={to}><Icon className="size-4 text-muted-foreground" />{label}</Link></Button>
            ))}
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4" />Subscription Plan</CardTitle><CardDescription>Current plan and usage</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><p className="font-medium">Professional Plan</p><p className="text-sm text-muted-foreground">$99 / month</p></div><Badge variant="secondary" className="bg-primary/10 text-primary">Active</Badge></div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Users used</span><span className="font-medium">12 / 25</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Storage used</span><span className="font-medium">4.2 GB / 50 GB</span></div>
            </div>
            <Separator />
            <Button variant="outline" className="w-full">Manage Subscription</Button>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4" />Recent Activity</CardTitle><CardDescription>Latest changes in your organisation</CardDescription></CardHeader>
          <CardContent><ul className="space-y-3">
            {[{ user: "Dr. Sarah Chen", action: "changed role permissions", time: "2 hours ago" },
              { user: "Admin", action: "invited new user john@clinic.com", time: "4 hours ago" },
              { user: "Dr. Sarah Chen", action: "updated clinic profile", time: "1 day ago" },
              { user: "Admin", action: "added billing department", time: "2 days ago" },
              { user: "System", action: "auto-renewed subscription", time: "5 days ago" },
            ].map(({ user, action, time }) => (
              <li key={`${user}-${time}`} className="flex items-start justify-between text-sm"><div className="min-w-0"><span className="font-medium">{user}</span> <span className="text-muted-foreground">{action}</span></div><time className="shrink-0 text-xs text-muted-foreground">{time}</time></li>
            ))}
          </ul></CardContent>
        </Card>
      </div>
    </div>
  );
}
