/**
 * FeatureFlagsEditor - Visual editor for feature_flags database table
 * Toggle features on/off without redeployment
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RefreshCw, 
  Settings2, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useFeatureFlags,
  useToggleFeatureFlag,
  useUpdateFeatureFlag,
  FLAG_CATEGORIES,
  getFlagsByCategory,
  type FeatureFlag,
} from "@/hooks/admin/useFeatureFlags";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

// Single feature flag item
function FeatureFlagItem({ 
  flag, 
  onToggle,
  onUpdate,
  isToggling,
}: { 
  flag: FeatureFlag;
  onToggle: (enabled: boolean) => void;
  onUpdate: (updates: Partial<Pick<FeatureFlag, 'rollout_percentage' | 'min_tier' | 'is_admin_only'>>) => void;
  isToggling?: boolean;
}) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center gap-3 p-3 min-h-[60px]">
        <span className="text-xl flex-shrink-0">{flag.icon || "📋"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{flag.name}</span>
            {flag.is_admin_only && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                <Shield className="h-3 w-3 mr-0.5" />
                Admin
              </Badge>
            )}
            {(flag.rollout_percentage ?? 100) < 100 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {flag.rollout_percentage}%
              </Badge>
            )}
          </div>
          {flag.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {flag.description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        <Switch
          checked={flag.enabled}
          onCheckedChange={onToggle}
          disabled={isToggling}
          className="flex-shrink-0"
        />
      </div>

      {showSettings && (
        <div className="border-t p-3 space-y-4 bg-muted/30">
          {/* Rollout Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Процент раскатки
              </label>
            <span className="text-sm text-muted-foreground">
                {flag.rollout_percentage ?? 100}%
              </span>
            </div>
            <Slider
              value={[flag.rollout_percentage ?? 100]}
              onValueChange={([value]) => onUpdate({ rollout_percentage: value })}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Минимальный тариф</label>
            <Select 
              value={flag.min_tier ?? 'free'} 
              onValueChange={(value) => onUpdate({ min_tier: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              Только для админов
            </label>
            <Switch
              checked={flag.is_admin_only ?? false}
              onCheckedChange={(checked) => onUpdate({ is_admin_only: checked })}
            />
          </div>

          {/* Last updated */}
          <p className="text-xs text-muted-foreground">
            Обновлено: {formatDistanceToNow(new Date(flag.updated_at), { addSuffix: true, locale: ru })}
          </p>
        </div>
      )}
    </div>
  );
}

// Category group
function FlagCategory({
  id,
  label,
  icon,
  flags,
  onToggle,
  onUpdate,
  isToggling,
  defaultExpanded = false,
}: {
  id: string;
  label: string;
  icon: string;
  flags: FeatureFlag[];
  onToggle: (flagId: string, enabled: boolean) => void;
  onUpdate: (flagId: string, updates: Partial<Pick<FeatureFlag, 'rollout_percentage' | 'min_tier' | 'is_admin_only'>>) => void;
  isToggling?: boolean;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const enabledCount = flags.filter((f) => f.enabled).length;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left transition-colors",
          "hover:bg-accent/50 active:bg-accent",
          "min-h-[56px]"
        )}
      >
        <span className="text-xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">
            {enabledCount}/{flags.length} включено
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t px-2 py-2 space-y-2 bg-muted/30">
          {flags.map((flag) => (
            <FeatureFlagItem
              key={flag.id}
              flag={flag}
              onToggle={(enabled) => onToggle(flag.id, enabled)}
              onUpdate={(updates) => onUpdate(flag.id, updates)}
              isToggling={isToggling}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeatureFlagsEditor() {
  const { data: flags, isLoading, error, refetch } = useFeatureFlags();
  const toggleFlag = useToggleFeatureFlag();
  const updateFlag = useUpdateFeatureFlag();

  const handleToggle = (flagId: string, enabled: boolean) => {
    toggleFlag.mutate({ id: flagId, enabled });
  };

  const handleUpdate = (flagId: string, updates: Partial<Pick<FeatureFlag, 'rollout_percentage' | 'min_tier' | 'is_admin_only'>>) => {
    updateFlag.mutate({ id: flagId, updates });
  };

  const categorizedFlags = flags ? getFlagsByCategory(flags) : new Map();

  // Stats
  const totalEnabled = flags?.filter((f) => f.enabled).length || 0;
  const totalFlags = flags?.length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Feature Flags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
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
            <Zap className="h-5 w-5" />
            Feature Flags
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {totalEnabled}/{totalFlags} активно
            </Badge>
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

      <CardContent className="space-y-3">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
          <Zap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Мгновенное управление функциями</p>
            <p className="text-muted-foreground">
              Включайте/выключайте функции без редеплоя. Изменения вступают в силу сразу.
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {FLAG_CATEGORIES.map((category) => {
            const categoryFlags = categorizedFlags.get(category.id);
            if (!categoryFlags || categoryFlags.length === 0) return null;

            return (
              <FlagCategory
                key={category.id}
                id={category.id}
                label={category.label}
                icon={category.icon}
                flags={categoryFlags}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                isToggling={toggleFlag.isPending}
                defaultExpanded={category.id === "core"}
              />
            );
          })}

          {/* Uncategorized */}
          {categorizedFlags.get("other") && (
            <FlagCategory
              id="other"
              label="Прочие"
              icon="📋"
              flags={categorizedFlags.get("other")!}
              onToggle={handleToggle}
              onUpdate={handleUpdate}
              isToggling={toggleFlag.isPending}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
