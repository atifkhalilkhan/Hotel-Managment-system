/* Profile editing and password management forms for the current account. */
import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import api from "../api/axios.js";
import useAuth from "../context/useAuth.js";
import { Alert, Button, Card, Input, PageHeader, Select, Textarea } from "../components/UI.jsx";

const getProfileFields = (source = {}) => ({
  name: source.name || "",
  phone: source.phone || "",
  address: source.address || "",
  city: source.city || "",
  country: source.country || "",
  preferences: {
    roomType: source.preferences?.roomType || "",
    bedType: source.preferences?.bedType || "",
    smoking: Boolean(source.preferences?.smoking),
    dietary: source.preferences?.dietary || "",
    notes: source.preferences?.notes || "",
  },
});

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(() => getProfileFields(user));
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFetching, setProfileFetching] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);
  const avatarPreviewRef = useRef(null);

  useEffect(() => {
    let active = true;
    api.get("/auth/me")
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setProfile(getProfileFields(currentUser));
      })
      .catch((error) => {
        if (active) setProfileMessage({ type: "error", text: error.message || "Unable to load your profile." });
      })
      .finally(() => {
        if (active) setProfileFetching(false);
      });
    return () => { active = false; };
  }, [setUser]);

  useEffect(() => {
    return () => {
      if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    };
  }, []);

  function clearAvatarPreview() {
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    avatarPreviewRef.current = null;
    setAvatarPreview("");
  }

  async function saveProfile(event) {
    event.preventDefault();
    setProfileMessage(null);
    if (!profile.name.trim()) return setProfileMessage({ type: "error", text: "Name is required." });
    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("phone", profile.phone);
      formData.append("address", profile.address);
      formData.append("city", profile.city);
      formData.append("country", profile.country);
      formData.append("preferences", JSON.stringify(profile.preferences));
      if (avatarFile) formData.append("avatar", avatarFile);
      else if (removeAvatar) formData.append("removeAvatar", "true");

      const updated = await api.put("/auth/update-profile", formData);
      setUser((current) => ({ ...current, ...updated }));
      setProfile(getProfileFields(updated));
      setAvatarFile(null);
      setRemoveAvatar(false);
      clearAvatarPreview();
      if (fileInputRef.current) fileInputRef.current.value = "";
      setProfileMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setProfileMessage({ type: "error", text: error.message || "Unable to update your profile." });
    } finally {
      setProfileLoading(false);
    }
  }

  function chooseAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileMessage({ type: "error", text: "Choose an image file." });
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: "error", text: "Image must be 5 MB or smaller." });
      event.target.value = "";
      return;
    }
    setProfileMessage(null);
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    avatarPreviewRef.current = URL.createObjectURL(file);
    setAvatarPreview(avatarPreviewRef.current);
    setAvatarFile(file);
    setRemoveAvatar(false);
  }

  function updatePreference(key, value) {
    setProfile((current) => ({
      ...current,
      preferences: { ...current.preferences, [key]: value },
    }));
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
    } catch (error) {
      setPasswordMessage({ type: "error", text: error.message || "Unable to change your password." });
    } finally {
      setPasswordLoading(false);
    }
  }

  const visibleAvatar = avatarPreview || (!removeAvatar ? user?.avatar?.url : "");

  return (
    <div>
      <PageHeader title="My profile" description="Manage your personal information, stay preferences, and account security." />
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card>
            <h2 className="font-semibold">Account details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="min-w-0"><dt className="text-xs text-muted">Email address</dt><dd className="mt-1 break-all text-sm font-medium">{user?.email}</dd></div>
              <div><dt className="text-xs text-muted">Role</dt><dd className="mt-1 text-sm font-medium capitalize">{user?.role}</dd></div>
            </dl>
            <form className="mt-6 space-y-5" onSubmit={saveProfile}>
              {profileMessage && <Alert type={profileMessage.type}>{profileMessage.text}</Alert>}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {visibleAvatar ? (
                  <img alt="Profile" className="h-20 w-20 rounded-full border border-line object-cover" src={visibleAvatar} />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-primary-dark"><Camera className="h-7 w-7" /></div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium hover:bg-page">
                    <Camera className="h-4 w-4" />Choose photo
                    <input accept="image/*" className="sr-only" onChange={chooseAvatar} ref={fileInputRef} type="file" />
                  </label>
                  {(visibleAvatar || avatarFile) && (
                    <Button disabled={profileLoading} onClick={() => {
                      setAvatarFile(null);
                      clearAvatarPreview();
                      setRemoveAvatar(Boolean(user?.avatar?.publicId || user?.avatar?.url));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }} type="button" variant="outline">
                      <Trash2 className="h-4 w-4" />Remove photo
                    </Button>
                  )}
                  <p className="w-full text-xs text-muted">Image file, up to 5 MB. It will be cropped to a square.</p>
                </div>
              </div>
              {profileFetching && <p className="text-sm text-muted">Loading saved profile details...</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input autoComplete="name" label="Full name" name="name" onChange={(event) => setProfile({ ...profile, name: event.target.value })} value={profile.name} />
                <Input autoComplete="tel" label="Phone" name="phone" onChange={(event) => setProfile({ ...profile, phone: event.target.value })} value={profile.phone} />
                <Input autoComplete="street-address" label="Address" name="address" onChange={(event) => setProfile({ ...profile, address: event.target.value })} value={profile.address} />
                <Input autoComplete="address-level2" label="City" name="city" onChange={(event) => setProfile({ ...profile, city: event.target.value })} value={profile.city} />
                <Input autoComplete="country-name" label="Country" name="country" onChange={(event) => setProfile({ ...profile, country: event.target.value })} value={profile.country} />
              </div>
              <Button className="w-full sm:w-auto" loading={profileLoading} type="submit">Save changes</Button>
            </form>
          </Card>

          <Card>
            <h2 className="font-semibold">Stay preferences</h2>
            <p className="mt-1 text-sm text-muted">These preferences help staff prepare for future stays.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Select label="Preferred room type" onChange={(event) => updatePreference("roomType", event.target.value)} value={profile.preferences.roomType}>
                <option value="">No preference</option><option value="single">Single</option><option value="double">Double</option><option value="deluxe">Deluxe</option><option value="suite">Suite</option>
              </Select>
              <Select label="Preferred bed type" onChange={(event) => updatePreference("bedType", event.target.value)} value={profile.preferences.bedType}>
                <option value="">No preference</option><option value="single">Single</option><option value="double">Double</option><option value="king">King</option><option value="twin">Twin</option>
              </Select>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-line px-3 text-sm sm:col-span-2">
                <input checked={profile.preferences.smoking} onChange={(event) => updatePreference("smoking", event.target.checked)} type="checkbox" />
                Smoking room preference
              </label>
              <Input label="Dietary requirements" maxLength={200} onChange={(event) => updatePreference("dietary", event.target.value)} value={profile.preferences.dietary} />
              <Textarea className="min-h-24" label="Additional notes" maxLength={500} onChange={(event) => updatePreference("notes", event.target.value)} value={profile.preferences.notes} />
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-muted">Use a password with at least 6 characters.</p>
          <form className="mt-5 space-y-4" onSubmit={changePassword}>
            {passwordMessage && <Alert type={passwordMessage.type}>{passwordMessage.text}</Alert>}
            <Input autoComplete="current-password" label="Current password" name="currentPassword" onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} type="password" value={password.currentPassword} />
            <Input autoComplete="new-password" label="New password" name="newPassword" onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} type="password" value={password.newPassword} />
            <Input autoComplete="new-password" label="Confirm new password" name="confirmPassword" onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })} type="password" value={password.confirmPassword} />
            <Button className="w-full sm:w-auto" loading={passwordLoading} type="submit">Update password</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
