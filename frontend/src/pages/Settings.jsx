/* Hotel-wide tax, room-rate defaults, and guest-facing policies. */
import { useEffect, useState } from "react";
import { DoorOpen, Eye, ReceiptText, RotateCcw, Save, Settings2 } from "lucide-react";
import api from "../api/axios.js";
import { Alert, Badge, Button, Card, Input, PageHeader, Textarea } from "../components/UI.jsx";
import { formatMoney, formatDateTime } from "../lib/invoiceUtils.js";

const roomTypes = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
];

const defaultSettings = {
  taxRate: "0",
  roomRates: { single: "", double: "", deluxe: "", suite: "" },
  policies: {
    checkInTime: "14:00",
    checkOutTime: "11:00",
    cancellation: "Contact the hotel as early as possible to change or cancel a reservation.",
    smoking: "Smoking is not permitted in guest rooms.",
    children: "Children are welcome. Contact the hotel for cot availability.",
  },
};

const settingEffects = [
  {
    Icon: ReceiptText,
    title: "Invoice tax",
    description: "The tax rate is copied onto invoices created from now on. Existing invoices do not change.",
  },
  {
    Icon: DoorOpen,
    title: "New room prices",
    description: "A saved rate fills the price when adding a room. You can still change it, and current rooms stay as they are.",
  },
  {
    Icon: Eye,
    title: "Guest policies",
    description: "Guests see these times and rules on the booking review screen.",
  },
];

function toForm(settings) {
  return {
    taxRate: String(settings.taxRate ?? 0),
    roomRates: Object.fromEntries(roomTypes.map(({ value }) => [value, settings.roomRates?.[value] ?? ""])),
    policies: { ...defaultSettings.policies, ...settings.policies },
  };
}

export default function Settings() {
  const [form, setForm] = useState(defaultSettings);
  const [savedForm, setSavedForm] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasUnsavedChanges = Boolean(savedForm) && JSON.stringify(form) !== JSON.stringify(savedForm);
  const fieldsDisabled = loading || !loaded || saving;

  useEffect(() => {
    let active = true;
    api.get("/settings")
      .then((settings) => {
        if (!active) return;
        const normalized = toForm(settings);
        setForm(normalized);
        setSavedForm(normalized);
        setLastSavedAt(settings.updatedAt || null);
        setLoaded(true);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load hotel settings.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const updateForm = (updater) => {
    setForm(updater);
    setSuccess("");
  };

  const updatePolicy = (field, value) => {
    updateForm((current) => ({ ...current, policies: { ...current.policies, [field]: value } }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!loaded || !hasUnsavedChanges) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        taxRate: Number(form.taxRate),
        roomRates: Object.fromEntries(roomTypes.map(({ value }) => [
          value,
          form.roomRates[value] === "" ? null : Number(form.roomRates[value]),
        ])),
        policies: form.policies,
      };
      const saved = await api.put("/settings", payload);
      const normalized = toForm(saved);
      setForm(normalized);
      setSavedForm(normalized);
      setLastSavedAt(saved.updatedAt || null);
      setSuccess("Changes saved. They will apply to new invoices, new rooms, and guest booking reviews as described below.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save hotel settings.");
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    if (!savedForm) return;
    setForm(savedForm);
    setError("");
    setSuccess("");
  };

  const sampleTax = (Number(form.taxRate) / 100) * 1000;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Hotel-wide defaults for invoices, newly added rooms, and guest booking information."
        icon={Settings2}
        title="Hotel Settings"
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert onClose={() => setSuccess("")} type="success">{success}</Alert>}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">What will these settings change?</h2>
            <p className="mt-1 text-sm text-muted">They are shared hotel settings, not settings for one room or one booking.</p>
          </div>
          <Badge tone={hasUnsavedChanges ? "warning" : loaded ? "success" : "neutral"}>
            {loading ? "Loading" : hasUnsavedChanges ? "Unsaved changes" : loaded ? "All changes saved" : "Settings unavailable"}
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {settingEffects.map(({ Icon, title, description }) => (
            <div className="rounded-lg border border-line bg-page p-4" key={title}>
              <div className="flex items-center gap-2 font-medium">
                <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
                <h3>{title}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            </div>
          ))}
        </div>
        {lastSavedAt && <p className="text-xs text-muted">Last saved {formatDateTime(lastSavedAt)}</p>}
      </Card>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="space-y-5" id="tax-settings">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><ReceiptText aria-hidden="true" className="h-5 w-5" /></span>
            <div>
              <h2 className="font-semibold">1. Invoice tax</h2>
              <p className="mt-1 text-sm leading-6 text-muted">This percentage is added when staff creates a new invoice. It will not recalculate invoices that already exist.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 md:items-end">
            <Input
              disabled={fieldsDisabled}
              id="tax-rate"
              label="Tax rate"
              max="100"
              min="0"
              onChange={(event) => updateForm((current) => ({ ...current, taxRate: event.target.value }))}
              required
              step="0.01"
              type="number"
              value={form.taxRate}
            />
            <div className="rounded-lg border border-primary/20 bg-primary-soft p-4 text-sm">
              <p className="font-medium text-primary-dark">Example</p>
              <p className="mt-1 text-primary-dark">
                On a taxable amount of {formatMoney(1000)}, this rate adds about {formatMoney(Number.isFinite(sampleTax) ? sampleTax : 0)} tax.
              </p>
              <p className="mt-1 text-xs text-primary-dark/80">The actual tax depends on the invoice subtotal and any discount.</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-5" id="room-rate-settings">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><DoorOpen aria-hidden="true" className="h-5 w-5" /></span>
            <div>
              <h2 className="font-semibold">2. New room price defaults</h2>
              <p className="mt-1 text-sm leading-6 text-muted">These are suggested starting prices per night. When adding a room, the matching rate fills in automatically and can still be edited.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {roomTypes.map(({ value, label }) => (
              <Input
                disabled={fieldsDisabled}
                id={`room-rate-${value}`}
                key={value}
                label={`${label} · per night`}
                min="0"
                onChange={(event) => updateForm((current) => ({
                  ...current,
                  roomRates: { ...current.roomRates, [value]: event.target.value },
                }))}
                placeholder="Not set"
                step="0.01"
                type="number"
                value={form.roomRates[value]}
              />
            ))}
          </div>
          <p className="rounded-lg bg-page p-3 text-sm leading-6 text-muted">
            Leave a rate blank if you want staff to enter it manually. Changing a default never changes the prices of rooms already in the system.
          </p>
        </Card>

        <Card className="space-y-5" id="guest-policy-settings">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><Eye aria-hidden="true" className="h-5 w-5" /></span>
            <div>
              <h2 className="font-semibold">3. Guest booking information</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Guests see these details on the final review step before submitting a booking.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              disabled={fieldsDisabled}
              id="check-in-time"
              label="Check-in time"
              onChange={(event) => updatePolicy("checkInTime", event.target.value)}
              required
              type="time"
              value={form.policies.checkInTime}
            />
            <Input
              disabled={fieldsDisabled}
              id="check-out-time"
              label="Check-out time"
              onChange={(event) => updatePolicy("checkOutTime", event.target.value)}
              required
              type="time"
              value={form.policies.checkOutTime}
            />
          </div>
          <Textarea
            disabled={fieldsDisabled}
            id="cancellation-policy"
            label="Cancellation policy"
            maxLength={1000}
            onChange={(event) => updatePolicy("cancellation", event.target.value)}
            required
            value={form.policies.cancellation}
          />
          <Textarea
            disabled={fieldsDisabled}
            id="smoking-policy"
            label="Smoking policy"
            maxLength={500}
            onChange={(event) => updatePolicy("smoking", event.target.value)}
            required
            value={form.policies.smoking}
          />
          <Textarea
            disabled={fieldsDisabled}
            id="children-policy"
            label="Children policy"
            maxLength={500}
            onChange={(event) => updatePolicy("children", event.target.value)}
            required
            value={form.policies.children}
          />
          <div aria-live="polite" className="rounded-lg border border-line bg-page p-4">
            <p className="flex items-center gap-2 font-medium"><Eye aria-hidden="true" className="h-4 w-4 text-primary" /> Guest preview</p>
            <p className="mt-3 text-sm"><span className="font-medium">Check-in:</span> {form.policies.checkInTime || "Not set"}</p>
            <p className="mt-1 text-sm"><span className="font-medium">Check-out:</span> {form.policies.checkOutTime || "Not set"}</p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <p><span className="font-medium text-ink">Cancellation:</span> {form.policies.cancellation || "No policy entered yet."}</p>
              <p><span className="font-medium text-ink">Smoking:</span> {form.policies.smoking || "No policy entered yet."}</p>
              <p><span className="font-medium text-ink">Children:</span> {form.policies.children || "No policy entered yet."}</p>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm text-muted">
            {hasUnsavedChanges ? "You have edits that are not saved yet." : loaded ? "Your saved settings are active." : "Settings must load before you can edit them."}
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {hasUnsavedChanges && (
              <Button disabled={saving} onClick={discardChanges} type="button" variant="outline">
                <RotateCcw aria-hidden="true" className="h-4 w-4" /> Discard changes
              </Button>
            )}
            <Button disabled={fieldsDisabled || !hasUnsavedChanges} loading={saving} type="submit">
              <Save aria-hidden="true" className="h-4 w-4" /> Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
