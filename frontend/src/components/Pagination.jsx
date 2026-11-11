/* Generic pagination UI with page numbers and per-page selector. */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "./UI.jsx";

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  const showFirst = currentPage > 2;
  const showLast = currentPage < totalPages - 1;
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, currentPage + 1);

  if (showFirst) pages.push(1);
  if (currentPage > 3) pages.push("...");
  for (let index = start; index <= end; index += 1) pages.push(index);
  if (currentPage < totalPages - 2) pages.push("...");
  if (showLast && !pages.includes(totalPages)) pages.push(totalPages);
  return pages;
}

export default function Pagination({
  page = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  itemLabel = "items",
  pageSizeOptions = [8, 12, 24],
  onPageChange,
  onPageSizeChange,
  className = "",
}) {
  const safeTotalItems = Number.isFinite(Number(totalItems)) ? Math.max(0, Number(totalItems)) : 0;
  const safePageSize = Number.isFinite(Number(pageSize)) && Number(pageSize) > 0 ? Number(pageSize) : 10;
  const safeTotalPages = Number.isFinite(Number(totalPages)) ? Math.max(1, Math.floor(Number(totalPages))) : 1;
  const safePage = Number.isFinite(Number(page)) ? Math.min(Math.max(1, Math.floor(Number(page))), safeTotalPages) : 1;
  const start = safeTotalItems === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const end = Math.min(safePage * safePageSize, safeTotalItems);

  return (
    <div className={`mt-6 flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div aria-live="polite" className="text-sm text-muted">Showing {start}-{end} of {safeTotalItems} {itemLabel}</div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button aria-label="Previous page" className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:border-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} type="button"><ChevronLeft className="h-4 w-4" /></button>
          <div className="hidden items-center gap-1 sm:flex">
            {getPageNumbers(safePage, safeTotalPages).map((item, index) =>
              item === "..." ? <span className="px-2 text-sm text-muted" key={`ellipsis-${index}`}>…</span> : (
                <button aria-current={item === safePage ? "page" : undefined} className={`h-10 min-w-10 rounded-lg px-3 text-sm font-medium transition-colors ${item === safePage ? "bg-primary text-white shadow-sm" : "border border-line bg-white text-ink hover:border-primary hover:bg-primary-soft"}`} key={`page-${item}`} onClick={() => onPageChange(item)} type="button">{item}</button>
              )
            )}
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-sm text-muted">Page {safePage} of {safeTotalPages}</span>
          </div>
          <button aria-label="Next page" className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:border-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40" disabled={safePage >= safeTotalPages} onClick={() => onPageChange(safePage + 1)} type="button"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>Per page</span>
          <Select aria-label={`${itemLabel} per page`} className="w-[90px]" onChange={(event) => onPageSizeChange(Number(event.target.value))} value={safePageSize}>
            {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}
