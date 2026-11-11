/* Guest invoice cards with status filters, PDF downloads, and Stripe checkout. */
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, ReceiptText } from "lucide-react";
import api from "../api/axios.js";
import Link from "../components/Link.jsx";
import { Alert, Badge, Button, Card, EmptyState, PageHeader } from "../components/UI.jsx";
import { downloadInvoicePdf, formatDateTime, formatMoney, getInvoiceStatusMeta } from "../lib/invoiceUtils.js";

const filters = [
  { value: "all", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
];

export default function MyInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/invoices/my")
      .then((items) => { if (active) setInvoices(items || []); })
      .catch((requestError) => { if (active) setError(requestError.message || "Unable to load your invoices."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleInvoices = useMemo(
    () => invoices.filter((invoice) => filter === "all" || invoice.status === filter),
    [filter, invoices]
  );

  const handleDownload = async (invoice) => {
    setBusy(`pdf:${invoice._id}`);
    setError("");
    try {
      await downloadInvoicePdf(invoice._id);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setBusy("");
    }
  };

  const handlePay = async (invoice) => {
    setBusy(`pay:${invoice._id}`);
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

  return (
    <div className="space-y-6">
      <PageHeader description="View and pay for your completed stays" title="My Invoices" />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}

      <Card className="p-4">
        <div aria-label="Filter invoices by status" className="flex flex-wrap gap-2" role="group">
          {filters.map((item) => (
            <button aria-pressed={filter === item.value} className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ${filter === item.value ? "bg-primary text-white" : "border border-line bg-white hover:bg-page"}`} key={item.value} onClick={() => setFilter(item.value)} type="button">
              {item.label}
              {item.value !== "all" && <span className="ml-2 text-xs opacity-80">{invoices.filter((invoice) => invoice.status === item.value).length}</span>}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => <Card className="h-52 animate-pulse bg-page" key={index} />)}
        </div>
      ) : visibleInvoices.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleInvoices.map((invoice) => {
            const statusMeta = getInvoiceStatusMeta(invoice.status);
            return (
              <Card className="space-y-4" key={invoice._id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><ReceiptText className="h-5 w-5" /></div>
                    <div className="min-w-0"><p className="truncate font-semibold">{invoice.invoiceNumber}</p><p className="text-sm text-muted">{invoice.reservation?.bookingCode || "Completed stay"}</p></div>
                  </div>
                  <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-page p-3 text-sm">
                  <div><p className="text-xs text-muted">Invoice date</p><p className="mt-1 font-medium">{formatDateTime(invoice.createdAt)}</p></div>
                  <div className="text-right"><p className="text-xs text-muted">Amount due</p><p className="mt-1 font-semibold">{formatMoney(invoice.total)}</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-page" href={`/invoices/${invoice._id}`}><Eye className="h-4 w-4" /> View</Link>
                  <Button className="h-10 min-h-10 px-3" loading={busy === `pdf:${invoice._id}`} onClick={() => handleDownload(invoice)} type="button" variant="outline"><Download className="h-4 w-4" /> Download PDF</Button>
                  {invoice.status === "unpaid" && <Button className="h-10 min-h-10 px-3" loading={busy === `pay:${invoice._id}`} onClick={() => handlePay(invoice)} type="button">Pay with card</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><EmptyState description={filter === "all" ? "Invoices for completed stays will appear here." : `No ${filter} invoices found.`} title="No invoices found" /></Card>
      )}
    </div>
  );
}
