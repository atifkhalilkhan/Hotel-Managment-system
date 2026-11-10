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

export default function Pagination({ page, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted">Showing {start}-{end} of {totalItems} rooms</div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button aria-label="Previous page" className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink disabled:cursor-not-allowed disabled:opacity-40" disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button"><ChevronLeft className="h-4 w-4" /></button>
          <div className="hidden items-center gap-1 sm:flex">
            {getPageNumbers(page, totalPages).map((item, index) =>
              item === "..." ? <span className="px-2 text-sm text-muted" key={`ellipsis-${index}`}>…</span> : (
                <button aria-current={item === page ? "page" : undefined} className={`h-10 min-w-10 rounded-lg px-3 text-sm ${item === page ? "bg-primary text-white" : "border border-line bg-white text-ink"}`} key={`page-${item}`} onClick={() => onPageChange(item)} type="button">{item}</button>
              )
            )}
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          </div>
          <button aria-label="Next page" className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink disabled:cursor-not-allowed disabled:opacity-40" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} type="button"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>Per page</span>
          <Select aria-label="Rooms per page" className="w-[90px]" onChange={(event) => onPageSizeChange(Number(event.target.value))} value={pageSize}>
            {[8, 12, 24].map((size) => <option key={size} value={size}>{size}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}
