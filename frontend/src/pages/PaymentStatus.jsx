/* Stripe return page; payment state is confirmed only by the backend. */
import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, LoaderCircle, XCircle } from "lucide-react";
import api from "../api/axios.js";
import Link from "../components/Link.jsx";
import { Alert, Button, Card, PageHeader } from "../components/UI.jsx";
import { formatMoney } from "../lib/invoiceUtils.js";

export default function PaymentStatus({ outcome }) {
  const invoiceId = new URLSearchParams(window.location.search).get("invoice") || "";
  const isSuccessReturn = outcome === "success";
  const [invoice, setInvoice] = useState(null);
  const [checking, setChecking] = useState(isSuccessReturn && Boolean(invoiceId));
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [verificationRun, setVerificationRun] = useState(0);

  useEffect(() => {
    if (!isSuccessReturn || !invoiceId) return undefined;
    let active = true;
    let timer;
    let attempts = 0;
    const maxAttempts = 15;

    const verify = async () => {
      attempts += 1;
      try {
        const result = await api.get(`/payments/verify/${encodeURIComponent(invoiceId)}`);
        if (!active) return;
        setStatus(result.status);
        if (result.status === "paid") {
          setChecking(false);
          try {
            const details = await api.get(`/invoices/${encodeURIComponent(invoiceId)}`);
            if (active) setInvoice(details);
          } catch (requestError) {
            if (active) setError(requestError.message || "Payment was confirmed, but invoice details could not be loaded.");
          }
          return;
        }
        if (result.status !== "unpaid") {
          setChecking(false);
          return;
        }
        setStatus("unpaid");
        setError("");
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || "Unable to verify payment status.");
      }

      if (!active) return;
      if (attempts >= maxAttempts) {
        setChecking(false);
        return;
      }
      timer = window.setTimeout(verify, 1000);
    };

    verify();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [invoiceId, isSuccessReturn, verificationRun]);

  const checkAgain = () => {
    setError("");
    setInvoice(null);
    setStatus(null);
    setChecking(true);
    setVerificationRun((run) => run + 1);
  };

  const retryPayment = async () => {
    setPaying(true);
    setError("");
    try {
      const payload = await api.post("/payments/create-checkout-session", { invoiceId });
      if (!payload?.url) throw new Error("Checkout session did not return a payment URL.");
      window.location.assign(payload.url);
    } catch (requestError) {
      setError(requestError.message || "Unable to start card payment.");
      setPaying(false);
    }
  };

  if (!invoiceId) {
    return <Card><Alert>Invoice reference is missing from the payment return URL.</Alert></Card>;
  }

  if (!isSuccessReturn) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <PageHeader description="Your invoice is still unpaid. You can try the card payment again." title="Payment cancelled" />
        {error && <Alert onClose={() => setError("")}>{error}</Alert>}
        <Card className="space-y-4 text-center">
          <XCircle className="mx-auto h-12 w-12 text-muted" />
          <p className="text-sm text-muted">No payment has been recorded.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button loading={paying} onClick={retryPayment} type="button"><CreditCard className="h-4 w-4" /> Try again</Button>
            <Link className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:bg-page" href={`/invoices/${invoiceId}`}>Back to invoice</Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader description="We are confirming your payment with the payment provider." title={status === "paid" ? "Payment successful" : "Confirming payment"} />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      <Card className="space-y-4 text-center">
        {status === "paid" ? <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" /> : checking ? <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-primary" /> : <XCircle className="mx-auto h-12 w-12 text-muted" />}
        <div>
          <p className="font-semibold">{status === "paid" ? "Payment received" : status === "void" ? "This invoice is void" : checking ? "Confirming your payment..." : "Payment confirmation is pending"}</p>
          <p className="mt-1 text-sm text-muted">{invoice?.invoiceNumber || "Invoice"}{invoice ? ` · ${formatMoney(invoice.total)}` : ""}</p>
        </div>
        {!checking && status !== "paid" && status !== "void" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/20 bg-primary-soft p-3 text-left text-sm text-primary-dark" role="status">
              We could not confirm your payment yet. If you were charged, it will show up shortly.
            </div>
            <Button onClick={checkAgain} type="button" variant="outline">Check again</Button>
          </div>
        )}
        {status === "paid" && <Link className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:bg-page" href={`/invoices/${invoiceId}`}>View invoice</Link>}
        {!checking && status !== "paid" && <Link className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:bg-page" href={`/invoices/${invoiceId}`}>Back to invoice</Link>}
      </Card>
    </div>
  );
}
