/**
 * HomeSearchBar — search input on homepage.
 * Navigates to Library with query on submit.
 */

import { useState, useCallback, memo } from "react";
import { Search, X } from "@/lib/icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HomeSearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
}

export const HomeSearchBar = memo(function HomeSearchBar({ onSearch, className }: HomeSearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (q) onSearch(q);
    },
    [query, onSearch],
  );

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)} role="search">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск треков..."
        className="h-11 min-h-[44px] pl-10 pr-10 rounded-xl bg-secondary/50 border-border/50 placeholder:text-muted-foreground/60"
        aria-label="Поиск треков"
      />
      {query.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Очистить поиск"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
});
