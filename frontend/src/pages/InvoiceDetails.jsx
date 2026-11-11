/* Full invoice details with role-gated adjustments and payment actions. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Ban, Car, Check, CircleHelp, Download, Shirt, ShoppingBag, Trash2, Utensils, Wine } from "lucide-react";
import api from "../api/axios.js";
import Link from "../components/Link.jsx";
import { Alert, Badge, Button, Card, ConfirmDialog, Input, Modal, PageHeader, Select } from "../components/UI.jsx";
import useAuth from "../context/useAuth.js";
import { downloadInvoicePdf, formatDateTime, formatDateValue, formatMoney, getChargeCategoryMeta, getInvoicePaymentMethodLabel, getInvoiceStatusMeta } from "../lib/invoiceUtils.js";

const chargeCategories = [
  { value: "food", label: "Food", Icon: Utensils },
  { value: "laundry", label: "Laundry", Icon: Shirt },
  { value: "room-service", label: "Room service", Icon: ShoppingBag },
  { value: "transport", label: "Transport", Icon: Car },
  { value: "minibar", label: "Minibar", Icon: Wine },
  { value: "other", label: "Other", Icon: CircleHelp },
];

export default function InvoiceDetails({ invoiceId }) {
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [voidOpen, setVoidOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("food");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId || invoiceId.includes("/")) {
      setError("Invoice not found.");
      setLoading(false);
      return;
    }
    setError("");
    try {
      const payload = await api.get(`/invoices/${encodeURIComponent(invoiceId)}`);
      setInvoice(payload);
    } catch (requestError) {
      setError(requestError.message || "Unable to load invoice.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    const timer = window.setTimeout(fetchInvoice, 0);
    return () => window.clearTimeout(timer);
  }, [fetchInvoice]);

  const role = user?.role;
  const isUnpaid = invoice?.status === "unpaid";
  const canAddCharge = isUnpaid && ["admin", "manager", "receptionist"].includes(role);
  const canDiscount = isUnpaid && ["admin", "manager"].includes(role);
  const canMarkPaid = isUnpaid && ["admin", "receptionist"].includes(role);
  const canPayWithCard = isUnpaid && ["admin", "receptionist", "guest"].includes(role);
  const canVoid = isUnpaid && role === "admin";

  const computedChargeTotal = useMemo(() => {
    const qty = Number(quantity);
    const price = Number(unitPrice);
    return Number.isFinite(qty * price) ? qty * price : 0;
  }, [quantity, unitPrice]);

  const updateAfterAction = async (busyKey, action, successMessage) => {
    setBusy(busyKey);
    setError("");
    setSuccess("");
    try {
      const result = await action();
      await fetchInvoice();
      setSuccess(result?.message || successMessage);
    } catch (requestError) {
      setError(requestError.message || "Unable to update invoice.");
    } finally {
      setBusy("");
    }
  };

  const handleAddCharge = async (event) => {
    event.preventDefault();
    await updateAfterAction("charge", async () => {
      await api.post(`/invoices/${invoice._id}/charges`, {
        description: description.trim(),
        category,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
      });
      setChargeOpen(false);
      setDescription("");
      setQuantity("1");
      setUnitPrice("");
    }, "Charge added.");
  };

  const handleDiscount = async (event) => {
    event.preventDefault();
    await updateAfterAction("discount", async () => {
      const payload = await api.patch(`/invoices/${invoice._id}/discount`, { discount: Number(discount) });
      setDiscountOpen(false);
      return payload;
    }, "Discount updated.");
  };

  const handleMarkPaid = async () => {
    await updateAfterAction("paid", async () => {
      const payload = await api.patch(`/invoices/${invoice._id}/pay`, { method: paymentMethod });
      setPaidOpen(false);
      return payload;
    }, "Invoice marked as paid.");
  };

  const handleRemoveCharge = async () => {
    if (!removeTarget) return;
    const chargeToRemove = removeTarget;
    await updateAfterAction("remove", async () => {
      const payload = await api.delete(`/invoices/${invoice._id}/charges/${chargeToRemove._id}`);
      setRemoveTarget(null);
      return payload;
    }, "Charge removed.");
  };

  const handleVoid = async () => {
    await updateAfterAction("void", async () => {
      const payload = await api.patch(`/invoices/${invoice._id}/void`, {});
      setVoidOpen(false);
      return payload;
    }, "Invoice voided.");
  };

  const handleStripePayment = async () => {
    setBusy("stripe");
    setError("");
    try {
      const payload = await api.post("/payments/create-checkout-session", { invoiceId: invoice._id });
      if (!payload?.url) throw new Error("Checkout session did not return a payment URL.");
      window.location.assign(payload.url);
    } catch (requestError) {
      setError(requestError.message || "Unable to start card payment.");
      setBusy("");
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    try {
      await downloadInvoicePdf(invoice._id);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <Card className="h-40 animate-pulse bg-page" />;
  }
  if (!invoice) {
    return <div className="space-y-4">{error && <Alert>{error}</Alert>}<Link className="inline-flex items-center gap-2 text-sm text-primary-dark" href="/invoices"><ArrowLeft className="h-4 w-4" /> Back to invoices</Link></div>;
  }

  const statusMeta = getInvoiceStatusMeta(invoice.status);
  const reservation = invoice.reservation || {};
  const guest = invoice.guest || {};
  const room = reservation.room || {};
  const statusDescription = invoice.status === "paid"
    ? `Paid ${invoice.paidAt ? `on ${formatDateTime(invoice.paidAt)}` : ""}${invoice.paymentMethod ? ` via ${getInvoicePaymentMethodLabel(invoice.paymentMethod)}` : ""}`
    : invoice.status === "void" ? "This invoice has been voided." : "Payment is due for this invoice.";

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink" href={role === "guest" ? "/my-invoices" : "/invoices"}>
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </Link>
      <PageHeader
        description={`Created ${formatDateTime(invoice.createdAt)}`}
        title={invoice.invoiceNumber}
        action={<Button loading={downloading} onClick={handleDownload} type="button" variant="outline"><Download className="h-4 w-4" /> Download PDF</Button>}
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert onClose={() => setSuccess("")} type="success">{success}</Alert>}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="text-sm font-semibold">Billed to</h2>
              <p className="mt-4 font-medium">{guest.name || "Guest"}</p>
              <p className="mt-1 text-sm text-muted">{guest.email || "-"}</p>
              <p className="text-sm text-muted">{guest.phone || "-"}</p>
            </Card>
            <Card>
              <h2 className="text-sm font-semibold">Stay details</h2>
              <p className="mt-4 font-medium">{reservation.bookingCode || "-"}</p>
              <p className="mt-1 text-sm text-muted">Room {room.roomNumber || "-"} {room.type ? `· ${room.type}` : ""}</p>
              <p className="mt-1 text-sm text-muted">{formatDateValue(reservation.checkIn)} to {formatDateValue(reservation.checkOut)}</p>
              <p className="mt-1 text-sm text-muted">{reservation.nights || 0} nights</p>
            </Card>
          </div>

          <Card className="p-0">
            <div className="border-b border-line p-4 sm:p-5">
              <h2 className="font-semibold">Charges</h2>
              <p className="mt-1 text-sm text-muted">Itemized room and additional charges</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-line bg-page text-xs uppercase tracking-wide text-muted">
                  <tr><th className="px-4 py-3 font-medium">Description</th><th className="px-4 py-3 font-medium">Quantity</th><th className="px-4 py-3 font-medium">Unit price</th><th className="px-4 py-3 text-right font-medium">Amount</th>{canAddCharge && <th className="w-16 px-4 py-3" />}</tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="px-4 py-3"><p className="font-medium">Room charges</p><p className="text-xs text-muted">Stay at LuxuryStay</p></td>
                    <td className="px-4 py-3">{reservation.nights || 1} nights</td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(invoice.roomCharges)}</td>
                    {canAddCharge && <td className="px-4 py-3" />}
                  </tr>
                  {(invoice.charges || []).map((charge) => {
                    const categoryInfo = getChargeCategoryMeta(charge.category);
                    return (
                      <tr key={charge._id}>
                        <td className="px-4 py-3"><p className="font-medium">{charge.description}</p><p className="text-xs text-muted">{categoryInfo.label}</p></td>
                        <td className="px-4 py-3">{charge.quantity}</td>
                        <td className="px-4 py-3">{formatMoney(charge.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatMoney(charge.amount)}</td>
                        {canAddCharge && <td className="px-4 py-3 text-right"><button aria-label={`Remove ${charge.description}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50" onClick={() => setRemoveTarget(charge)} type="button"><Trash2 className="h-4 w-4" /></button></td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {canAddCharge && <div className="border-t border-line p-4"><Button onClick={() => setChargeOpen(true)} type="button" variant="outline">Add charge</Button></div>}
          </Card>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-semibold">Invoice status</h2><p className="mt-1 text-sm text-muted">{statusDescription}</p></div>
              <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            </div>
            {isUnpaid && <div className="mt-5 flex flex-wrap gap-3">
              {canMarkPaid && <Button onClick={() => setPaidOpen(true)} type="button"><Check className="h-4 w-4" /> Mark as paid</Button>}
              {canPayWithCard && <Button loading={busy === "stripe"} onClick={handleStripePayment} type="button">Pay with card</Button>}
              {canVoid && <Button onClick={() => setVoidOpen(true)} type="button" variant="danger"><Ban className="h-4 w-4" /> Void invoice</Button>}
            </div>}
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:col-span-4">
          <Card>
            <h2 className="font-semibold">Invoice summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><span className="text-muted">Subtotal</span><span>{formatMoney(invoice.subtotal)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Discount</span><span>- {formatMoney(invoice.discount)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted">Tax ({Number(invoice.taxRate || 0).toFixed(2)}%)</span><span>{formatMoney(invoice.taxAmount)}</span></div>
              <div className="flex justify-between gap-3 border-t border-line pt-4 text-base font-semibold"><span>Total</span><span>{formatMoney(invoice.total)}</span></div>
            </div>
            {canDiscount && <Button className="mt-5 w-full" onClick={() => { setDiscount(String(invoice.discount || 0)); setDiscountOpen(true); }} type="button" variant="outline">Apply discount</Button>}
          </Card>
          <Card className="bg-page">
            <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Payment</h2><Badge tone={statusMeta.tone}>{statusMeta.label}</Badge></div>
            <p className="mt-3 text-sm text-muted">{invoice.status === "paid" ? `${getInvoicePaymentMethodLabel(invoice.paymentMethod)} · ${formatDateTime(invoice.paidAt)}` : invoice.status === "void" ? "No payment is due." : "Awaiting payment."}</p>
            {invoice.status === "unpaid" && canPayWithCard && <Button className="mt-4 w-full" loading={busy === "stripe"} onClick={handleStripePayment} type="button">Pay with card</Button>}
          </Card>
        </aside>
      </div>

      <Modal onClose={() => setChargeOpen(false)} open={chargeOpen} title="Add extra charge">
        <form className="space-y-4" onSubmit={handleAddCharge}>
          <Input autoFocus label="Description" maxLength={120} onChange={(event) => setDescription(event.target.value)} required value={description} />
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="charge-category">Category</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {chargeCategories.map(({ value, label, Icon }) => (
                <button aria-pressed={category === value} className={`flex h-11 items-center gap-2 rounded-lg border px-3 text-sm ${category === value ? "border-primary bg-primary-soft text-primary-dark" : "border-line hover:bg-page"}`} key={value} onClick={() => setCategory(value)} type="button">
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Quantity" min="1" onChange={(event) => setQuantity(event.target.value)} required type="number" value={quantity} />
            <Input label="Unit price" min="0" onChange={(event) => setUnitPrice(event.target.value)} required step="0.01" type="number" value={unitPrice} />
          </div>
          <div className="flex justify-between rounded-lg bg-page p-3 text-sm"><span className="text-muted">Line total</span><span className="font-semibold">{formatMoney(computedChargeTotal)}</span></div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setChargeOpen(false)} type="button" variant="outline">Cancel</Button>
            <Button loading={busy === "charge"} type="submit">Add charge</Button>
          </div>
        </form>
      </Modal>

      <Modal onClose={() => setDiscountOpen(false)} open={discountOpen} title="Apply discount">
        <form className="space-y-4" onSubmit={handleDiscount}>
          <p className="text-sm text-muted">Enter a fixed amount, not a percentage. Maximum: {formatMoney(invoice.subtotal)}.</p>
          <Input label="Discount amount" min="0" max={invoice.subtotal} onChange={(event) => setDiscount(event.target.value)} required step="0.01" type="number" value={discount} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setDiscountOpen(false)} type="button" variant="outline">Cancel</Button>
            <Button loading={busy === "discount"} type="submit">Save discount</Button>
          </div>
        </form>
      </Modal>

      <Modal onClose={() => setPaidOpen(false)} open={paidOpen} title="Mark invoice as paid">
        <div className="space-y-4">
          <p className="text-sm text-muted">Record the payment method received at the counter.</p>
          <Select id="payment-method" label="Payment method" onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </Select>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setPaidOpen(false)} type="button" variant="outline">Cancel</Button>
            <Button loading={busy === "paid"} onClick={handleMarkPaid} type="button">Confirm payment</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog loading={busy === "remove"} onClose={() => setRemoveTarget(null)} onConfirm={handleRemoveCharge} open={Boolean(removeTarget)} title="Remove charge">
        Remove "{removeTarget?.description}" from this invoice?
      </ConfirmDialog>
      <ConfirmDialog loading={busy === "void"} onClose={() => setVoidOpen(false)} onConfirm={handleVoid} open={voidOpen} title="Void invoice">
        This will void invoice {invoice.invoiceNumber}. This action cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
