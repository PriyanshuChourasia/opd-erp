import { useState } from "react";
import { AtSign, Camera, Check, KeyRound, Pencil, Save, ShieldCheck, User, X } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sessionInfo = [
    { label: "Role", value: user?.roleName ?? "—" },
    { label: "Permissions", value: `${user?.permissions.length ?? 0} permissions assigned` },
    { label: "Member since", value: "January 2026" },
    { label: "Last login", value: "Today at 10:32 AM" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Profile</h1><p className="mt-1 text-sm text-muted-foreground">Manage your personal information and account settings</p></div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-16"><AvatarFallback className="text-lg">{initials(user?.name ?? "?")}</AvatarFallback></Avatar>
              <button type="button" className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"><Camera className="size-3" /></button>
            </div>
            <div><CardTitle className="text-xl">{user?.name ?? "User"}</CardTitle><CardDescription className="flex items-center gap-2"><AtSign className="size-3" />{user?.email ?? "—"}</CardDescription></div>
          </div>
          <Badge variant="secondary" className="shrink-0"><ShieldCheck className="mr-1 size-3" />{user?.roleName ?? "No role"}</Badge>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2 text-base"><User className="size-4" />Personal Information</CardTitle><CardDescription>{editing ? "Edit your details below" : "Your personal details as shown across the system"}</CardDescription></div>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="mr-2 size-3.5" />Edit</Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setName(user?.name ?? ""); setEmail(user?.email ?? ""); }}><X className="mr-2 size-3.5" />Cancel</Button>
                <Button size="sm" onClick={() => setEditing(false)}><Save className="mr-2 size-3.5" />Save</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {editing ? (
              <FieldGroup><div className="grid gap-4 sm:grid-cols-2">
                <Field><FieldLabel htmlFor="profile-name">Full Name</FieldLabel><Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field><FieldLabel htmlFor="profile-email">Email</FieldLabel><Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              </div></FieldGroup>
            ) : (
              <dl className="space-y-3">
                <div className="flex items-center justify-between text-sm"><dt className="text-muted-foreground">Full Name</dt><dd className="font-medium">{user?.name ?? "—"}</dd></div><Separator />
                <div className="flex items-center justify-between text-sm"><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{user?.email ?? "—"}</dd></div><Separator />
                <div className="flex items-center justify-between text-sm"><dt className="text-muted-foreground">User ID</dt><dd className="font-mono text-xs">{user?.id ?? "—"}</dd></div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="size-4" />Password</CardTitle><CardDescription>Update your account password</CardDescription></CardHeader>
          <CardContent>
            {changingPassword ? (
              <FieldGroup>
                <Field><FieldLabel htmlFor="current-pwd">Current Password</FieldLabel><Input id="current-pwd" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></Field>
                <Field><FieldLabel htmlFor="new-pwd">New Password</FieldLabel><Input id="new-pwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
                <Field><FieldLabel htmlFor="confirm-pwd">Confirm Password</FieldLabel><Input id="confirm-pwd" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></Field>
              </FieldGroup>
            ) : (<p className="text-sm text-muted-foreground">Last changed 3 months ago</p>)}
          </CardContent>
          <CardFooter className="border-t pt-4">
            {changingPassword ? (
              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setChangingPassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>Cancel</Button>
                <Button className="flex-1" onClick={() => setChangingPassword(false)} disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}><Check className="mr-2 size-4" />Update Password</Button>
              </div>
            ) : (<Button variant="outline" className="w-full" onClick={() => setChangingPassword(true)}><KeyRound className="mr-2 size-4" />Change Password</Button>)}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4" />Account Info</CardTitle><CardDescription>Session and role details</CardDescription></CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {sessionInfo.map(({ label, value }) => (
                <div key={label}><div className="flex items-center justify-between text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div><Separator className="mt-3" /></div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
