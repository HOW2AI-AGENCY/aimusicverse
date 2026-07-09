/**
 * HomeSearchBar — search input on homepage.
 * Navigates to Library with query on submit.
 */

import { useState, useCallback } from "react";
import { Search } from "@/lib/icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HomeSearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function HomeSearchBar({ onSearch, className }: HomeSearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (q) onSearch(q);
    },
    [query, onSearch],
  );

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)} role="search">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск треков..."
        className="h-10 pl-10 pr-4 rounded-xl bg-secondary/50 border-border/50 placeholder:text-muted-foreground/60"
        aria-label="Поиск треков"
      />
    </form>
  );
}
