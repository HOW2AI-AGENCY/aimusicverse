/**
 * PresetManager Component (Sprint 031 — US3 Professional Studio Dashboard)
 *
 * Mobile-first panel for browsing, applying, creating, and deleting studio
 * presets. Groups presets by ownership (system / public / mine), supports
 * search + category filtering, and exposes a "save current settings" flow.
 *
 * Features:
 * - Category tabs (all / vocal / guitar / drums / mastering / fx / custom)
 * - Search by name or description
 * - Apply a preset to the active track (with usage tracking)
 * - Save current studio settings as a new preset
 * - Clone system/public presets into the user's library
 * - Delete own presets with confirmation
 * - Telegram haptic feedback, 44px+ touch targets
 *
 * @module src/components/studio/unified/PresetManager
 * @see src/hooks/usePresets.ts for data management
 * @see src/api/presets.api.ts for the API layer
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedDialog } from "@/components/dialog";
import { Textarea } from "@/components/ui/textarea";
import { usePresets, useCreatePreset, useDeletePreset, useApplyPreset, useClonePreset } from "@/hooks/usePresets";
import { useAuth } from "@/contexts/AuthContext";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import type { Preset, PresetCategory, PresetSettings } from "@/api/presets.api";
import { cn } from "@/lib/utils";
import { Search, Plus, Trash2, Copy, Check, Lock, Globe, User as UserIcon, Sparkles, Loader2 } from "@/lib/icons";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { value: PresetCategory | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "vocal", label: "Вокал" },
  { value: "guitar", label: "Гитара" },
  { value: "drums", label: "Ударные" },
  { value: "mastering", label: "Мастеринг" },
  { value: "fx", label: "Эффекты" },
  { value: "custom", label: "Свои" },
];

interface PresetManagerProps {
  /** Track the preset will be applied to. When absent, apply is disabled. */
  trackId?: string;
  /** Current studio settings to capture when saving a new preset. */
  currentSettings?: PresetSettings;
  /** Default category used when saving a new preset. */
  defaultCategory?: PresetCategory;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ownershipBadge(preset: Preset) {
  if (preset.is_system) {
    return { icon: Lock, label: "Системный", tone: "text-amber-400" };
  }
  if (preset.is_public) {
    return { icon: Globe, label: "Публичный", tone: "text-sky-400" };
  }
  return { icon: UserIcon, label: "Мой", tone: "text-emerald-400" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PresetManager({ trackId, currentSettings, defaultCategory = "custom", className }: PresetManagerProps) {
  const { user } = useAuth();
  const haptic = useHapticFeedback();

  const [category, setCategory] = useState<PresetCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Preset | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  const { presets, isLoading } = usePresets({
    category: category === "all" ? undefined : category,
    userId: user?.id,
    searchQuery: search.trim() || undefined,
  });

  const { applyPreset, isApplying } = useApplyPreset();
  const { deletePreset, isDeleting } = useDeletePreset();
  const { clonePreset, isCloning } = useClonePreset();

  // Group presets by ownership for clearer scanning on mobile
  const grouped = useMemo(() => {
    const mine: Preset[] = [];
    const system: Preset[] = [];
    const community: Preset[] = [];
    for (const p of presets) {
      if (p.is_system) system.push(p);
      else if (p.user_id === user?.id) mine.push(p);
      else community.push(p);
    }
    return { mine, system, community };
  }, [presets, user?.id]);

  const handleApply = useCallback(
    (preset: Preset) => {
      if (!trackId) return;
      haptic.tap();
      applyPreset({ trackId, presetId: preset.id }, { onSuccess: () => setAppliedId(preset.id) });
    },
    [trackId, applyPreset, haptic],
  );

  const handleDelete = useCallback(() => {
    if (!pendingDelete) return;
    haptic.warning();
    deletePreset(pendingDelete.id, { onSettled: () => setPendingDelete(null) });
  }, [pendingDelete, deletePreset, haptic]);

  const handleClone = useCallback(
    (preset: Preset) => {
      haptic.tap();
      clonePreset({ presetId: preset.id });
    },
    [clonePreset, haptic],
  );

  const renderPreset = (preset: Preset) => {
    const badge = ownershipBadge(preset);
    const BadgeIcon = badge.icon;
    const isOwn = !preset.is_system && preset.user_id === user?.id;
    const isApplied = appliedId === preset.id;

    return (
      <motion.div
        key={preset.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
      >
        <Card className="border-border/60 bg-card/60">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{preset.name}</span>
                <BadgeIcon className={cn("h-3.5 w-3.5 shrink-0", badge.tone)} />
              </div>
              {preset.description && <p className="truncate text-xs text-muted-foreground">{preset.description}</p>}
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {preset.category}
                </Badge>
                {preset.usage_count > 0 && (
                  <span className="text-[10px] text-muted-foreground">{preset.usage_count} использований</span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {trackId && (
                <Button
                  size="sm"
                  variant={isApplied ? "secondary" : "default"}
                  className="h-11 min-w-[44px] px-3"
                  disabled={isApplying}
                  onClick={() => handleApply(preset)}
                >
                  {isApplied ? <Check className="h-4 w-4" /> : "Применить"}
                </Button>
              )}
              {!isOwn && user?.id && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11"
                  disabled={isCloning}
                  onClick={() => handleClone(preset)}
                  aria-label="Скопировать пресет"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {isOwn && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 text-destructive"
                  onClick={() => setPendingDelete(preset)}
                  aria-label="Удалить пресет"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderGroup = (title: string, items: Preset[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
        <AnimatePresence initial={false}>{items.map(renderPreset)}</AnimatePresence>
      </div>
    );
  };

  const isEmpty =
    !isLoading && grouped.mine.length === 0 && grouped.system.length === 0 && grouped.community.length === 0;

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      {/* Search + Save */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск пресетов…"
            className="h-11 pl-9"
          />
        </div>
        {currentSettings && user?.id && (
          <Button
            size="sm"
            className="h-11 gap-1.5 px-3"
            onClick={() => {
              haptic.tap();
              setSaveOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Сохранить
          </Button>
        )}
      </div>

      {/* Category tabs */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as PresetCategory | "all")}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.value} value={c.value} className="text-xs">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>
      </Tabs>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 pb-4 pr-2">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {isEmpty && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <Sparkles className="h-8 w-8 opacity-50" />
              <p className="text-sm">Пресеты не найдены</p>
              {currentSettings && user?.id && (
                <Button variant="link" size="sm" onClick={() => setSaveOpen(true)}>
                  Сохранить текущие настройки
                </Button>
              )}
            </div>
          )}

          {renderGroup("Мои пресеты", grouped.mine)}
          {renderGroup("Системные", grouped.system)}
          {renderGroup("Сообщество", grouped.community)}
        </div>
      </ScrollArea>

      {/* Save dialog */}
      <SavePresetDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        settings={currentSettings}
        defaultCategory={defaultCategory}
      />

      {/* Delete confirmation */}
      <UnifiedDialog
        variant="modal"
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Удалить пресет?"
        description={`«${pendingDelete?.name}» будет удалён без возможности восстановления.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Отмена
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Удалить"}
            </Button>
          </div>
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save dialog (internal)
// ---------------------------------------------------------------------------

interface SavePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings?: PresetSettings;
  defaultCategory: PresetCategory;
}

function SavePresetDialog({ open, onOpenChange, settings, defaultCategory }: SavePresetDialogProps) {
  const haptic = useHapticFeedback();
  const { createPreset, isCreating } = useCreatePreset();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PresetCategory>(defaultCategory);

  const reset = () => {
    setName("");
    setDescription("");
    setCategory(defaultCategory);
  };

  const handleSave = () => {
    if (!name.trim() || !settings) return;
    haptic.success();
    createPreset(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        settings,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Сохранить пресет"
      description="Текущие настройки студии будут сохранены как пресет."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button disabled={!name.trim() || isCreating} onClick={handleSave}>
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название пресета"
          className="h-11"
          maxLength={100}
          autoFocus
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (необязательно)"
          rows={2}
        />
        <Tabs value={category} onValueChange={(v) => setCategory(v as PresetCategory)}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max">
              {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                <TabsTrigger key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </Tabs>
      </div>
    </UnifiedDialog>
  );
}

export default PresetManager;
