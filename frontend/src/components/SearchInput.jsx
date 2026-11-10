/* Search field with a clear action and leading icon. */
import { Search, X } from "lucide-react";
import { Input } from "./UI.jsx";

export default function SearchInput({ value, onChange, onClear, placeholder = "Search", ariaLabel = "Search" }) {
  return (
    <div className="relative min-w-0">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        aria-label={ariaLabel}
        className="pl-10 pr-10"
        onChange={onChange}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value && (
        <button aria-label="Clear search" className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-page" onClick={onClear} type="button">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
