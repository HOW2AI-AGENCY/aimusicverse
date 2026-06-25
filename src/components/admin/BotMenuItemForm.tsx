/**
 * Bot Menu Item Form Component
 * Form for creating and editing menu items
 */

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import {
  useCreateMenuItem,
  useUpdateMenuItem,
  uploadMenuItemImage,
  type BotMenuItem,
  type CreateMenuItemInput,
} from "@/hooks/useBotMenuItems";
import { toast } from "sonner";

const EMOJI_OPTIONS = [
  "🏠",
  "📱",
  "ℹ️",
  "💎",
  "🚀",
  "🎵",
  "📁",
  "📰",
  "👤",
  "⚙️",
  "📖",
  "📤",
  "☁️",
  "💬",
  "🏢",
  "🔬",
  "👥",
  "📞",
  "❓",
  "✨",
  "🎨",
  "🎧",
  "🎤",
  "🎹",
  "💡",
  "⭐",
  "🔥",
  "💫",
  "🎯",
  "📊",
];

const ACTION_TYPES = [
  { value: "callback", label: "Callback", description: "Внутреннее действие бота" },
  { value: "webapp", label: "WebApp", description: "Открыть Mini App" },
  { value: "submenu", label: "Подменю", description: "Открыть вложенное меню" },
  { value: "url", label: "Ссылка", description: "Внешняя ссылка" },
];

interface BotMenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BotMenuItem | null;
  parentKey: string | null;
  existingKeys: string[];
  onClose: () => void;
}

export function BotMenuItemForm({ open, onOpenChange, item, parentKey, existingKeys, onClose }: BotMenuItemFormProps) {
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();

  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<CreateMenuItemInput>({
    menu_key: "",
    parent_key: parentKey,
    sort_order: 0,
    title: "",
    caption: null,
    description: null,
    image_url: null,
    image_fallback: null,
    action_type: "callback",
    action_data: null,
    row_position: 0,
    column_span: 1,
    is_enabled: true,
    show_in_menu: true,
    requires_auth: false,
    icon_emoji: "📄",
  });

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        menu_key: item.menu_key,
        parent_key: item.parent_key,
        sort_order: item.sort_order,
        title: item.title,
        caption: item.caption,
        description: item.description,
        image_url: item.image_url,
        image_fallback: item.image_fallback,
        action_type: item.action_type,
        action_data: item.action_data,
        row_position: item.row_position,
        column_span: item.column_span,
        is_enabled: item.is_enabled,
        show_in_menu: item.show_in_menu,
        requires_auth: item.requires_auth,
        icon_emoji: item.icon_emoji,
      });
    } else {
      setFormData({
        menu_key: "",
        parent_key: parentKey,
        sort_order: 0,
        title: "",
        caption: null,
        description: null,
        image_url: null,
        image_fallback: null,
        action_type: "callback",
        action_data: null,
        row_position: 0,
        column_span: 1,
        is_enabled: true,
        show_in_menu: true,
        requires_auth: false,
        icon_emoji: "📄",
      });
    }
  }, [item, parentKey]);

  const handleChange = (field: keyof CreateMenuItemInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.menu_key) {
      toast.error("Сначала укажите ключ пункта меню");
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadMenuItemImage(file, formData.menu_key);
      handleChange("image_url", url);
      toast.success("Изображение загружено");
    } catch (error) {
      toast.error("Ошибка загрузки изображения");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.menu_key) {
      toast.error("Укажите ключ пункта меню");
      return;
    }

    if (!formData.title) {
      toast.error("Укажите заголовок");
      return;
    }

    // Check for duplicate key
    if (!item && existingKeys.includes(formData.menu_key)) {
      toast.error("Пункт с таким ключом уже существует");
      return;
    }

    try {
      if (item) {
        await updateMutation.mutateAsync({ id: item.id, ...formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Редактировать пункт меню" : "Добавить пункт меню"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Основное</TabsTrigger>
              <TabsTrigger value="action">Действие</TabsTrigger>
              <TabsTrigger value="media">Медиа</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="menu_key">Ключ *</Label>
                  <Input
                    id="menu_key"
                    value={formData.menu_key}
                    onChange={(e) => handleChange("menu_key", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                    placeholder="unique_key"
                    disabled={!!item}
                  />
                  <p className="text-xs text-muted-foreground">Уникальный идентификатор (латиница, цифры, _)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Заголовок *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Название кнопки"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Эмодзи</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant={formData.icon_emoji === emoji ? "default" : "outline"}
                      size="icon"
                      className="h-10 w-10 text-lg"
                      onClick={() => handleChange("icon_emoji", emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value || null)}
                  placeholder="Описание для подменю"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Порядок сортировки</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => handleChange("sort_order", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="row_position">Позиция в строке</Label>
                  <Input
                    id="row_position"
                    type="number"
                    value={formData.row_position}
                    onChange={(e) => handleChange("row_position", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="column_span">Ширина (1-2)</Label>
                  <Select
                    value={String(formData.column_span)}
                    onValueChange={(v) => handleChange("column_span", parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (половина)</SelectItem>
                      <SelectItem value="2">2 (полная ширина)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label>Включён</Label>
                  <p className="text-xs text-muted-foreground">Показывать пункт в меню</p>
                </div>
                <Switch checked={formData.is_enabled} onCheckedChange={(v) => handleChange("is_enabled", v)} />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label>Требует авторизации</Label>
                  <p className="text-xs text-muted-foreground">Показывать только авторизованным</p>
                </div>
                <Switch checked={formData.requires_auth} onCheckedChange={(v) => handleChange("requires_auth", v)} />
              </div>
            </TabsContent>

            <TabsContent value="action" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Тип действия</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTION_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={formData.action_type === type.value ? "default" : "outline"}
                      className="h-auto py-3 flex-col items-start"
                      onClick={() => handleChange("action_type", type.value)}
                    >
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs opacity-70">{type.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action_data">
                  {formData.action_type === "webapp" && "Путь в приложении"}
                  {formData.action_type === "url" && "URL ссылки"}
                  {formData.action_type === "callback" && "Callback data"}
                  {formData.action_type === "submenu" && "Не используется"}
                </Label>
                <Input
                  id="action_data"
                  value={formData.action_data || ""}
                  onChange={(e) => handleChange("action_data", e.target.value || null)}
                  placeholder={
                    formData.action_type === "webapp"
                      ? "/pricing"
                      : formData.action_type === "url"
                        ? "https://..."
                        : formData.action_type === "callback"
                          ? "nav_library"
                          : "Автоматически"
                  }
                  disabled={formData.action_type === "submenu"}
                />
                {formData.action_type === "webapp" && (
                  <p className="text-xs text-muted-foreground">Путь будет добавлен к URL Mini App</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Изображение</Label>

                {formData.image_url ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                    <img src={formData.image_url} alt="Menu preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => handleChange("image_url", null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Нажмите для загрузки</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG до 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading || !formData.menu_key}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_fallback">Fallback URL</Label>
                <Input
                  id="image_fallback"
                  value={formData.image_fallback || ""}
                  onChange={(e) => handleChange("image_fallback", e.target.value || null)}
                  placeholder="https://images.unsplash.com/..."
                />
                <p className="text-xs text-muted-foreground">Используется если основное изображение недоступно</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption (MarkdownV2)</Label>
                <Textarea
                  id="caption"
                  value={formData.caption || ""}
                  onChange={(e) => handleChange("caption", e.target.value || null)}
                  placeholder="*Заголовок*\n\nОписание меню..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Текст под изображением. Поддерживает Telegram MarkdownV2
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : item ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
