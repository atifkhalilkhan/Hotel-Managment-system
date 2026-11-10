/* Profile editing and password management forms for the current account. */
import { useState } from "react";
import api from "../api/axios.js";
import useAuth from "../context/useAuth.js";
import { Alert, Button, Card, Input, PageHeader } from "../components/UI.jsx";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setProfileMessage(null);
    if (!profile.name.trim()) return setProfileMessage({ type: "error", text: "Name is required." });
    setProfileLoading(true);
    try {
      const updated = await api.put("/auth/update-profile", profile);
      setUser((current) => ({ ...current, ...updated }));
      setProfileMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) { setProfileMessage({ type: "error", text: error.message }); } finally { setProfileLoading(false); }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordMessage(null);
    if (!password.currentPassword || !password.newPassword) return setPasswordMessage({ type: "error", text: "All password fields are required." });
    if (password.newPassword.length < 6) return setPasswordMessage({ type: "error", text: "New password must be at least 6 characters." });
    if (password.newPassword !== password.confirmPassword) return setPasswordMessage({ type: "error", text: "New passwords do not match." });
    setPasswordLoading(true);
    try {
      const result = await api.put("/auth/change-password", { currentPassword: password.currentPassword, newPassword: password.newPassword });
      setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage({ type: "success", text: result.message || "Password changed successfully." });
    } catch (error) { setPasswordMessage({ type: "error", text: error.message }); } finally { setPasswordLoading(false); }
  }

  return (
    <div>
      <PageHeader title="My profile" description="Manage your personal information and account security." />
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <Card><h2 className="font-semibold">Account details</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div className="min-w-0"><dt className="text-xs text-muted">Email address</dt><dd className="mt-1 break-all text-sm font-medium">{user?.email}</dd></div><div><dt className="text-xs text-muted">Role</dt><dd className="mt-1 text-sm font-medium capitalize">{user?.role}</dd></div></dl>
          <form className="mt-6 space-y-4" onSubmit={saveProfile}>{profileMessage && <Alert type={profileMessage.type}>{profileMessage.text}</Alert>}<Input autoComplete="name" label="Full name" name="name" onChange={(event) => setProfile({ ...profile, name: event.target.value })} value={profile.name} /><Input autoComplete="tel" label="Phone" name="phone" onChange={(event) => setProfile({ ...profile, phone: event.target.value })} value={profile.phone} /><Button className="w-full sm:w-auto" loading={profileLoading} type="submit">Save changes</Button></form>
        </Card>
        <Card><h2 className="font-semibold">Change password</h2><p className="mt-1 text-sm text-muted">Use a password with at least 6 characters.</p><form className="mt-5 space-y-4" onSubmit={changePassword}>{passwordMessage && <Alert type={passwordMessage.type}>{passwordMessage.text}</Alert>}<Input autoComplete="current-password" label="Current password" name="currentPassword" onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} type="password" value={password.currentPassword} /><Input autoComplete="new-password" label="New password" name="newPassword" onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} type="password" value={password.newPassword} /><Input autoComplete="new-password" label="Confirm new password" name="confirmPassword" onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })} type="password" value={password.confirmPassword} /><Button className="w-full sm:w-auto" loading={passwordLoading} type="submit">Update password</Button></form></Card>
      </div>
    </div>
  );
}
