/**
 * LyricsTagsPanels — редактор тегов и chip-bar.
 *
 * Два режима:
 * - Tags Panel (открыт): TagsEditor для добавления/удаления тегов
 * - Enriched Tags Bar (закрыт): горизонтальная полоса badges
 *
 * Извлечено из pages/LyricsStudio.tsx в Sprint 042 (god-page декомпозиция).
 */

import { AnimatePresence, motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, X } from "@/lib/icons";
import { TagsEditor } from "@/components/lyrics-workspace";

interface LyricsTagsPanelsProps {
  /** Открыт ли редактор тегов (если нет, рендерим chip-bar). */
  open: boolean;
  /** Текущие пользовательские теги. */
  globalTags: string[];
  /** Подсказки тегов из секционных заметок. */
  enrichedTags: string[];
  /** Колбэки. */
  onOpen: () => void;
  onClose: () => void;
  onChange: (tags: string[]) => void;
}

export function LyricsTagsPanels({ open, globalTags, enrichedTags, onOpen, onClose, onChange }: LyricsTagsPanelsProps) {
  return (
    <>
      {/* Tags Panel (открыт) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border/50 overflow-hidden bg-muted/30"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Теги для генерации
                </h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <TagsEditor
                tags={globalTags}
                onChange={(tags) => {
                  onChange(tags);
                }}
                suggestedTags={enrichedTags}
                maxTags={15}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enriched Tags Bar (закрыт) */}
      <AnimatePresence>
        {!open && (globalTags.length > 0 || enrichedTags.length > 0) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border/30 overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={onOpen}
          >
            <div className="px-4 py-2.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Tag className="w-3.5 h-3.5" />
                Теги:
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {[...globalTags, ...enrichedTags].slice(0, 8).map((tag, idx) => (
                  <Badge key={`${tag}-${idx}`} variant="secondary" className="text-xs whitespace-nowrap">
                    {tag}
                  </Badge>
                ))}
                {globalTags.length + enrichedTags.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{globalTags.length + enrichedTags.length - 8}
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
