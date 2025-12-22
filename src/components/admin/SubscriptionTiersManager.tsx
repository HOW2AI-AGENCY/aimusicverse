import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { 
  Save, 
  Edit2, 
  Star, 
  CreditCard, 
  Coins, 
  Zap,
  Music,
  Settings,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionTier {
  id: string;
  code: string;
  name: Record<string, string>;
  description: Record<string, string>;
  icon_emoji: string;
  price_usd: number;
  price_stars: number;
  price_robokassa: number;
  credits_amount: number;
  credits_period: string;
  max_concurrent_generations: number;
  audio_quality: string;
  has_priority: boolean;
  has_stem_separation: boolean;
  has_mastering: boolean;
  has_midi_export: boolean;
  has_api_access: boolean;
  has_dedicated_support: boolean;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  badge_text: string | null;
  features: string[];
  custom_pricing: boolean;
  min_purchase_amount: number;
  created_at: string;
  updated_at: string;
}

export function SubscriptionTiersManager() {
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [editedTier, setEditedTier] = useState<Partial<SubscriptionTier>>({});
  const [isEditing, setIsEditing] = useState(false);

  const { data: tiers, isLoading, refetch } = useQuery({
    queryKey: ['subscription-tiers-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionTier[];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (tier: Partial<SubscriptionTier> & { id: string }) => {
      const { error } = await supabase
        .from('subscription_tiers')
        .update(tier)
        .eq('id', tier.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-tiers-admin'] });
      toast.success('Тариф обновлён');
      setIsEditing(false);
      setSelectedTier(null);
    },
    onError: (error) => {
      toast.error('Ошибка сохранения: ' + (error as Error).message);
    }
  });

  const handleEdit = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setEditedTier({
      price_usd: tier.price_usd,
      price_stars: tier.price_stars,
      price_robokassa: tier.price_robokassa,
      credits_amount: tier.credits_amount,
      credits_period: tier.credits_period,
      max_concurrent_generations: tier.max_concurrent_generations,
      is_active: tier.is_active,
      is_featured: tier.is_featured,
      badge_text: tier.badge_text,
      has_priority: tier.has_priority,
      has_stem_separation: tier.has_stem_separation,
      has_mastering: tier.has_mastering,
      has_midi_export: tier.has_midi_export,
      has_api_access: tier.has_api_access,
      has_dedicated_support: tier.has_dedicated_support,
      min_purchase_amount: tier.min_purchase_amount,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedTier) return;
    
    updateMutation.mutate({
      id: selectedTier.id,
      ...editedTier
    });
  };

  const getTierIcon = (code: string) => {
    switch (code) {
      case 'free': return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'basic': return <span className="text-xl">🥉</span>;
      case 'pro': return <span className="text-xl">🥈</span>;
      case 'premium': return <span className="text-xl">🥇</span>;
      case 'enterprise': return <span className="text-xl">🏆</span>;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const formatPeriod = (period: string) => {
    const periods: Record<string, string> = {
      day: 'сутки',
      week: 'неделю',
      month: 'месяц',
      year: 'год'
    };
    return periods[period] || period;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Тарифные планы</h2>
          <p className="text-sm text-muted-foreground">
            Управление ценами и настройками подписок
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiers?.map((tier) => (
          <Card 
            key={tier.id} 
            className={cn(
              "relative cursor-pointer transition-all hover:shadow-md",
              tier.is_featured && "ring-2 ring-primary",
              !tier.is_active && "opacity-60"
            )}
            onClick={() => handleEdit(tier)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTierIcon(tier.code)}
                  <CardTitle className="text-lg">
                    {tier.name.ru || tier.code}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {tier.badge_text && (
                    <Badge variant="secondary" className="text-xs">
                      {tier.badge_text}
                    </Badge>
                  )}
                  {!tier.is_active && (
                    <Badge variant="outline" className="text-xs">
                      Неактивен
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                {tier.description.ru || tier.description.en}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold">${tier.price_usd}</div>
                  <div className="text-xs text-muted-foreground">USD</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold">{tier.price_stars}</div>
                  <div className="text-xs text-muted-foreground">Stars</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold">{tier.price_robokassa}₽</div>
                  <div className="text-xs text-muted-foreground">RUB</div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Кредиты</span>
                <span className="font-medium">
                  {tier.credits_amount}/{formatPeriod(tier.credits_period)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Треков</span>
                <span className="font-medium">{tier.max_concurrent_generations}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {tier.has_priority && <Badge variant="outline" className="text-xs">Приоритет</Badge>}
                {tier.has_stem_separation && <Badge variant="outline" className="text-xs">Стемы</Badge>}
                {tier.has_mastering && <Badge variant="outline" className="text-xs">Мастеринг</Badge>}
                {tier.has_api_access && <Badge variant="outline" className="text-xs">API</Badge>}
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(tier);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Sheet */}
      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedTier && getTierIcon(selectedTier.code)}
              {selectedTier?.name.ru || selectedTier?.code}
            </SheetTitle>
            <SheetDescription>
              Редактирование тарифного плана
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
            <div className="space-y-6 py-6">
              {/* Pricing Section */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Цены
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>USD</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editedTier.price_usd ?? 0}
                      onChange={(e) => setEditedTier({
                        ...editedTier,
                        price_usd: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stars ⭐</Label>
                    <Input
                      type="number"
                      value={editedTier.price_stars ?? 0}
                      onChange={(e) => setEditedTier({
                        ...editedTier,
                        price_stars: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RUB ₽</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editedTier.price_robokassa ?? 0}
                      onChange={(e) => setEditedTier({
                        ...editedTier,
                        price_robokassa: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>

                {selectedTier?.custom_pricing && (
                  <div className="space-y-2">
                    <Label>Минимальная сумма (USD)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={editedTier.min_purchase_amount ?? 0}
                      onChange={(e) => setEditedTier({
                        ...editedTier,
                        min_purchase_amount: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Credits Section */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Кредиты
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Количество</Label>
                    <Input
                      type="number"
                      value={editedTier.credits_amount ?? 0}
                      onChange={(e) => setEditedTier({
                        ...editedTier,
                        credits_amount: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Период</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      value={editedTier.credits_period ?? 'month'}
                      onChange={(e) => setEditedTier({
                        ...editedTier,
                        credits_period: e.target.value
                      })}
                    >
                      <option value="day">Сутки</option>
                      <option value="week">Неделя</option>
                      <option value="month">Месяц</option>
                      <option value="year">Год</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Макс. треков одновременно</Label>
                  <Input
                    type="number"
                    value={editedTier.max_concurrent_generations ?? 2}
                    onChange={(e) => setEditedTier({
                      ...editedTier,
                      max_concurrent_generations: parseInt(e.target.value) || 2
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Features Section */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Функции
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Приоритетная генерация</Label>
                    <Switch
                      checked={editedTier.has_priority ?? false}
                      onCheckedChange={(checked) => setEditedTier({
                        ...editedTier,
                        has_priority: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Stem-сепарация</Label>
                    <Switch
                      checked={editedTier.has_stem_separation ?? false}
                      onCheckedChange={(checked) => setEditedTier({
                        ...editedTier,
                        has_stem_separation: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Мастеринг</Label>
                    <Switch
                      checked={editedTier.has_mastering ?? false}
                      onCheckedChange={(checked) => setEditedTier({
                        ...editedTier,
                        has_mastering: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>MIDI экспорт</Label>
                    <Switch
                      checked={editedTier.has_midi_export ?? false}
                      onCheckedChange={(checked) => setEditedTier({
                        ...editedTier,
                        has_midi_export: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>API доступ</Label>
                    <Switch
                      checked={editedTier.has_api_access ?? false}
                      onCheckedChange={(checked) => setEditedTier({
                        ...editedTier,
                        has_api_access: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Выделенная поддержка</Label>
                    <Switch
                      checked={editedTier.has_dedicated_support ?? false}
                      onCheckedChange={(checked) => setEditedTier({
                        ...editedTier,
                        has_dedicated_support: checked
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Display Section */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Отображение
                </h3>
                
                <div className="space-y-2">
                  <Label>Бейдж</Label>
                  <Input
                    placeholder="Популярный, Лучшая цена..."
                    value={editedTier.badge_text ?? ''}
                    onChange={(e) => setEditedTier({
                      ...editedTier,
                      badge_text: e.target.value || null
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Активен</Label>
                  <Switch
                    checked={editedTier.is_active ?? true}
                    onCheckedChange={(checked) => setEditedTier({
                      ...editedTier,
                      is_active: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Рекомендуемый</Label>
                  <Switch
                    checked={editedTier.is_featured ?? false}
                    onCheckedChange={(checked) => setEditedTier({
                      ...editedTier,
                      is_featured: checked
                    })}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditing(false)}
            >
              Отмена
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Сохранить
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}