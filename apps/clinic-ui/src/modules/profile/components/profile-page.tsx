import { useCallback, useState } from "react";
import {
  AtSign,
  Camera,
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  Pencil,
  Save,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/auth-slice";
import { initials } from "@/lib/utils";
import { updateProfile, changePassword } from "@/lib/api";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  // ─── Profile edit state ──────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);

  // ─── Password change state ───────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // ─── Feedback state ──────────────────────────────────────────
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showFeedback = useCallback((success: string | null, error: string | null) => {
    setSuccessMsg(success);
    setErrorMsg(error);
    if (success || error) {
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 5000);
    }
  }, []);

  // ─── Handlers ────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setSaving(true);
    showFeedback(null, null);
    try {
      const updated = await updateProfile({ name, email });
      // Update Redux store so the sidebar and other components reflect the new data
      dispatch(
        setCredentials({
          accessToken: localStorage.getItem("clinic_access_token") ?? "",
          user: updated,
        }),
      );
      setEditing(false);
      showFeedback("Profile updated successfully", null);
    } catch (err) {
      showFeedback(null, extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    showFeedback(null, null);
    try {
      await changePassword({ currentPassword, newPassword });
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showFeedback("Password changed successfully", null);
    } catch (err) {
      showFeedback(null, extractApiError(err));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelPassword = () => {
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Format createdAt date nicely
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "—";

  const sessionInfo = [
    { label: "Role", value: user?.roleName ?? "—" },
    { label: "Permissions", value: `${user?.permissions.length ?? 0} permissions assigned` },
    { label: "Member since", value: memberSince },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Feedback banner */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <XCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile header card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-16">
                <AvatarFallback className="text-lg">
                  {initials(user?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <Camera className="size-3" />
              </button>
            </div>
            <div>
              <CardTitle className="text-xl">{user?.name ?? "User"}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <AtSign className="size-3" />
                {user?.email ?? "—"}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            <ShieldCheck className="mr-1 size-3" />
            {user?.roleName ?? "No role"}
          </Badge>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4" />
                Personal Information
              </CardTitle>
              <CardDescription>
                {editing
                  ? "Edit your details below"
                  : "Your personal details as shown across the system"}
              </CardDescription>
            </div>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 size-3.5" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <X className="mr-2 size-3.5" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-3.5" />
                  )}
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {editing ? (
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="profile-name">Full Name</FieldLabel>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={saving}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={saving}
                    />
                  </Field>
                </div>
              </FieldGroup>
            ) : (
              <dl className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground">Full Name</dt>
                  <dd className="font-medium">{user?.name ?? "—"}</dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{user?.email ?? "—"}</dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground">User ID</dt>
                  <dd className="font-mono text-xs">{user?.id ?? "—"}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4" />
              Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            {showPasswordForm ? (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="current-pwd">Current Password</FieldLabel>
                  <Input
                    id="current-pwd"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={changingPassword}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-pwd">New Password</FieldLabel>
                  <Input
                    id="new-pwd"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={changingPassword}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-pwd">Confirm Password</FieldLabel>
                  <Input
                    id="confirm-pwd"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={changingPassword}
                  />
                </Field>
              </FieldGroup>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a strong, unique password to keep your account secure
              </p>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            {showPasswordForm ? (
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelPassword}
                  disabled={changingPassword}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleChangePassword}
                  disabled={
                    changingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                >
                  {changingPassword ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 size-4" />
                  )}
                  {changingPassword ? "Updating…" : "Update Password"}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPasswordForm(true)}
              >
                <KeyRound className="mr-2 size-4" />
                Change Password
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" />
              Account Info
            </CardTitle>
            <CardDescription>Session and role details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {sessionInfo.map(({ label, value }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                  <Separator className="mt-3" />
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
