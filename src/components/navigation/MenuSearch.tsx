/**
 * MenuSearch - Search input for MoreMenuSheet
 */

import { memo, useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  description?: string;
  section?: string;
}

interface MenuSearchProps {
  items: MenuItem[];
  onNavigate: (path: string) => void;
  isActive: (path: string) => boolean;
}

export const MenuSearch = memo(function MenuSearch({ 
  items, 
  onNavigate, 
  isActive 
}: MenuSearchProps) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return items.filter(item => 
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.section?.toLowerCase().includes(q)
    );
  }, [query, items]);

  const handleClear = () => {
    setQuery('');
  };

  const handleSelect = (path: string) => {
    onNavigate(path);
    setQuery('');
  };

  return (
    <div className="relative mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Поиск по меню..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-10 bg-muted/50 border-border/50 rounded-xl"
        />
        <AnimatePresence>
          {query && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-6 w-6 rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {filteredItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10"
          >
            {filteredItems.map((item, index) => (
              <motion.button
                key={item.path}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleSelect(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 text-left",
                  "hover:bg-muted/50 transition-colors",
                  isActive(item.path) && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg",
                  isActive(item.path) ? "bg-primary/20" : "bg-muted"
                )}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm block truncate">{item.label}</span>
                  {item.section && (
                    <span className="text-[10px] text-muted-foreground">{item.section}</span>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      <AnimatePresence>
        {query && filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg p-4 text-center z-10"
          >
            <p className="text-sm text-muted-foreground">Ничего не найдено</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
