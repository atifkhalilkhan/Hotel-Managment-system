/* Staff invoice ledger with status filters, search, and pagination. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Eye } from "lucide-react";
import api from "../api/axios.js";
import Link from "../components/Link.jsx";
import Pagination from "../components/Pagination.jsx";
import SearchInput from "../components/SearchInput.jsx";
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Select, Table } from "../components/UI.jsx";
import { downloadInvoicePdf, formatDateTime, formatMoney, getInvoiceStatusMeta } from "../lib/invoiceUtils.js";

const statusOptions = [
  { value: "all", label: "All status" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [downloadingId, setDownloadingId] = useState("");
  const requestId = useRef(0);

  const fetchInvoices = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setError("");
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);

    try {
      const payload = await api.get(`/invoices?${params.toString()}`);
      if (requestId.current !== currentRequest) return;
      setInvoices(payload.invoices || []);
      setTotalPages(payload.pages || 1);
      setTotal(payload.total || 0);
    } catch (requestError) {
      if (requestId.current === currentRequest) setError(requestError.message || "Unable to load invoices.");
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(fetchInvoices, 0);
    return () => window.clearTimeout(timer);
  }, [fetchInvoices]);

  const handleDownload = async (invoice) => {
    setError("");
    setDownloadingId(invoice._id);
    try {
      await downloadInvoicePdf(invoice._id);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloadingId("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader description={`${total} invoices in the billing ledger`} title="Invoices" />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <SearchInput
              ariaLabel="Search invoices"
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              onClear={() => { setSearch(""); setPage(1); }}
              placeholder="Search invoice number"
              value={search}
            />
          </div>
          <div className="w-full max-w-[220px]">
            <Select id="invoice-status" label="Status" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </div>
          <Button onClick={clearFilters} type="button" variant="outline">Clear filters</Button>
        </div>
      </Card>

      {loading ? (
        <Card className="divide-y divide-line p-0">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="flex gap-3 px-4 py-3" key={index}>
              <div className="h-9 w-28 animate-pulse rounded-lg bg-page" />
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-page" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-page" />
            </div>
          ))}
        </Card>
      ) : invoices.length ? (
        <Card className="p-0">
          <Table headings={["Invoice", "Reservation", "Guest", "Amount", "Status", "Actions"]}>
            {invoices.map((invoice) => {
              const statusMeta = getInvoiceStatusMeta(invoice.status);
              return (
                <tr key={invoice._id}>
                  <td className="px-4 py-3 align-middle">
                    <p className="font-semibold">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted">{formatDateTime(invoice.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <p className="font-medium">{invoice.reservation?.bookingCode || "-"}</p>
                    <p className="text-xs text-muted">{invoice.reservation?.room?.roomNumber ? `Room ${invoice.reservation.room.roomNumber}` : "No room"}</p>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <p className="font-medium">{invoice.guest?.name || "Guest"}</p>
                    <p className="text-xs text-muted">{invoice.guest?.phone || invoice.guest?.email || "-"}</p>
                  </td>
                  <td className="px-4 py-3 align-middle font-medium">{formatMoney(invoice.total)}</td>
                  <td className="px-4 py-3 align-middle"><Badge tone={statusMeta.tone}>{statusMeta.label}</Badge></td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <Link className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-page" href={`/invoices/${invoice._id}`}>
                        <Eye className="h-4 w-4" /> View
                      </Link>
                      <Button className="h-10 min-h-10 px-3" loading={downloadingId === invoice._id} onClick={() => handleDownload(invoice)} type="button" variant="outline">
                        <Download className="h-4 w-4" /> PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
          <div className="px-4">
            <Pagination
              className="mt-0"
              itemLabel="invoices"
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              page={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              totalItems={total}
              totalPages={totalPages}
            />
          </div>
        </Card>
      ) : (
        <Card><EmptyState description="Try adjusting the search or status filter." title="No invoices found" /></Card>
      )}
    </div>
  );
}
