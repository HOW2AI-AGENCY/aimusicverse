/**
 * EconomyConfigEditor - Visual editor for economy_config database table
 * Mobile-optimized with accordion categories and inline editing
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, 
  Search, 
  Settings2, 
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from "lucide-react";
import { EconomyCategory } from "./EconomyCategory";
import {
  useEconomyConfig,
  useUpdateEconomyConfig,
  ECONOMY_CATEGORIES,
  getConfigByCategory,
  CONFIG_LABELS,
} from "@/hooks/admin/useEconomyConfig";
import { ECONOMY } from "@/lib/economy";

// Default values from code (for reset functionality)
const DEFAULT_VALUES: Record<string, number> = {
  GENERATION_COST: 10,
  COVER_GENERATION_COST: ECONOMY.COVER_GENERATION_COST,
  EXTEND_GENERATION_COST: ECONOMY.EXTEND_GENERATION_COST,
  STEM_SEPARATION_COST: ECONOMY.STEM_SEPARATION_COST,
  MIDI_EXPORT_COST: ECONOMY.MIDI_EXPORT_COST,
  AUDIO_ANALYSIS_COST: ECONOMY.AUDIO_ANALYSIS_COST,
  DAILY_CHECKIN_CREDITS: ECONOMY.DAILY_CHECKIN.credits,
  DAILY_CHECKIN_XP: ECONOMY.DAILY_CHECKIN.xp,
  STREAK_BONUS_CREDITS: ECONOMY.STREAK_BONUS.credits_per_day,
  STREAK_BONUS_XP: ECONOMY.STREAK_BONUS.xp_per_day,
  SHARE_REWARD_CREDITS: ECONOMY.SHARE_REWARD.credits,
  SHARE_REWARD_XP: ECONOMY.SHARE_REWARD.xp,
  LIKE_RECEIVED_CREDITS: ECONOMY.LIKE_RECEIVED.credits,
  LIKE_RECEIVED_XP: ECONOMY.LIKE_RECEIVED.xp,
  PUBLIC_TRACK_CREDITS: ECONOMY.PUBLIC_TRACK.credits,
  PUBLIC_TRACK_XP: ECONOMY.PUBLIC_TRACK.xp,
  COMMENT_POSTED_CREDITS: ECONOMY.COMMENT_POSTED.credits,
  COMMENT_POSTED_XP: ECONOMY.COMMENT_POSTED.xp,
  ARTIST_CREATED_CREDITS: ECONOMY.ARTIST_CREATED.credits,
  ARTIST_CREATED_XP: ECONOMY.ARTIST_CREATED.xp,
  PROJECT_CREATED_CREDITS: ECONOMY.PROJECT_CREATED.credits,
  PROJECT_CREATED_XP: ECONOMY.PROJECT_CREATED.xp,
  REFERRAL_PERCENT: ECONOMY.REFERRAL_PERCENT,
  REFERRAL_INVITE_BONUS: ECONOMY.REFERRAL_INVITE_BONUS,
  REFERRAL_NEW_USER_BONUS: ECONOMY.REFERRAL_NEW_USER_BONUS,
  CREDITS_PER_USD: ECONOMY.CREDITS_PER_USD,
  STARS_PER_USD: ECONOMY.STARS_PER_USD,
  CREDITS_PER_STAR: ECONOMY.CREDITS_PER_STAR,
  PURCHASE_XP_PER_100_STARS: ECONOMY.PURCHASE_XP_PER_100_STARS,
};

export function EconomyConfigEditor() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: configItems, isLoading, error, refetch } = useEconomyConfig();
  const updateConfig = useUpdateEconomyConfig();

  const handleSave = (key: string, value: number) => {
    updateConfig.mutate({ key, value });
  };

  // Filter items by search query
  const filteredItems = configItems?.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const label = CONFIG_LABELS[item.key]?.toLowerCase() || "";
    return (
      item.key.toLowerCase().includes(query) ||
      label.includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });

  // Group items by category
  const categorizedItems = filteredItems ? getConfigByCategory(filteredItems) : new Map();

  // Count changed items
  const totalChanged = configItems?.filter(
    (item) => DEFAULT_VALUES[item.key] !== undefined && DEFAULT_VALUES[item.key] !== item.value
  ).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Настройки экономики
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Ошибка загрузки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Неизвестная ошибка"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="flex items-center gap-2 flex-1">
            <Settings2 className="h-5 w-5" />
            Настройки экономики
          </CardTitle>
          <div className="flex items-center gap-2">
            {totalChanged > 0 && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                {totalChanged} изменено
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск параметра..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Изменения применяются мгновенно</p>
            <p className="text-muted-foreground">
              Нажмите на значение для редактирования. Изменения сразу вступают в силу.
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {ECONOMY_CATEGORIES.map((category) => {
            const items = categorizedItems.get(category.id);
            if (!items || items.length === 0) return null;

            return (
              <EconomyCategory
                key={category.id}
                id={category.id}
                label={category.label}
                icon={category.icon}
                items={items}
                onSave={handleSave}
                isSaving={updateConfig.isPending}
                defaultExpanded={category.id === "costs"}
                defaultValues={DEFAULT_VALUES}
              />
            );
          })}

          {/* Uncategorized items */}
          {categorizedItems.get("other") && (
            <EconomyCategory
              id="other"
              label="Прочие параметры"
              icon="📋"
              items={categorizedItems.get("other")!}
              onSave={handleSave}
              isSaving={updateConfig.isPending}
              defaultValues={DEFAULT_VALUES}
            />
          )}
        </div>

        {/* Empty state */}
        {filteredItems?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Параметры не найдены</p>
            <Button
              variant="link"
              onClick={() => setSearchQuery("")}
              className="mt-2"
            >
              Сбросить поиск
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
