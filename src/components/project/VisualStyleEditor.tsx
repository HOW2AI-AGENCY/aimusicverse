import { useState, memo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Palette, 
  Type, 
  Image, 
  Sparkles, 
  Plus, 
  X,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  [key: string]: string | undefined;
}

interface VisualStyleEditorProps {
  visualAesthetic?: string | null;
  colorPalette?: ColorPalette | null;
  typographyStyle?: string | null;
  imageStyle?: string | null;
  visualKeywords?: string[] | null;
  onSave: (data: {
    visual_aesthetic?: string;
    color_palette?: ColorPalette;
    typography_style?: string;
    image_style?: string;
    visual_keywords?: string[];
  }) => void;
  isSaving?: boolean;
}

const TYPOGRAPHY_STYLES = [
  { value: 'modern', label: 'Современный', description: 'Чистые линии, sans-serif' },
  { value: 'classic', label: 'Классический', description: 'Элегантный, serif' },
  { value: 'handwritten', label: 'Рукописный', description: 'Органичный, живой' },
  { value: 'grunge', label: 'Гранж', description: 'Текстурный, raw' },
  { value: 'minimal', label: 'Минимал', description: 'Простой, легкий' },
  { value: 'retro', label: 'Ретро', description: 'Винтажный стиль' },
  { value: 'futuristic', label: 'Футуризм', description: 'Технологичный' },
];

const IMAGE_STYLES = [
  { value: 'photography', label: 'Фотография', description: 'Реалистичные фото' },
  { value: 'illustration', label: 'Иллюстрация', description: 'Рисованная графика' },
  { value: '3d', label: '3D Рендер', description: 'Объемные сцены' },
  { value: 'abstract', label: 'Абстракция', description: 'Формы и цвета' },
  { value: 'collage', label: 'Коллаж', description: 'Микс элементов' },
  { value: 'anime', label: 'Аниме', description: 'Японский стиль' },
  { value: 'cyberpunk', label: 'Киберпанк', description: 'Неон и технологии' },
  { value: 'vintage', label: 'Винтаж', description: 'Ретро эстетика' },
];

export const VisualStyleEditor = memo(function VisualStyleEditor({
  visualAesthetic,
  colorPalette,
  typographyStyle,
  imageStyle,
  visualKeywords,
  onSave,
  isSaving,
}: VisualStyleEditorProps) {
  const [formData, setFormData] = useState({
    visual_aesthetic: visualAesthetic || '',
    typography_style: typographyStyle || '',
    image_style: imageStyle || '',
    color_palette: colorPalette || {
      primary: '#6366f1',
      secondary: '#a855f7',
      accent: '#ec4899',
      background: '#0f172a',
    },
    visual_keywords: visualKeywords || [],
  });

  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.visual_keywords.includes(newKeyword.trim())) {
      setFormData({
        ...formData,
        visual_keywords: [...formData.visual_keywords, newKeyword.trim()],
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      visual_keywords: formData.visual_keywords.filter(k => k !== keyword),
    });
  };

  const handleSave = () => {
    onSave({
      visual_aesthetic: formData.visual_aesthetic || undefined,
      color_palette: formData.color_palette,
      typography_style: formData.typography_style || undefined,
      image_style: formData.image_style || undefined,
      visual_keywords: formData.visual_keywords.length > 0 ? formData.visual_keywords : undefined,
    });
  };

  return (
    <div className="space-y-5">
      {/* Visual Aesthetic Description */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Визуальная эстетика
        </Label>
        <Textarea
          value={formData.visual_aesthetic}
          onChange={(e) => setFormData({ ...formData, visual_aesthetic: e.target.value })}
          placeholder="Опишите желаемый визуальный стиль: настроение, атмосфера, цветовая гамма..."
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Это описание используется AI для генерации обложек и баннеров
        </p>
      </div>

      {/* Typography Style */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Type className="w-4 h-4 text-primary" />
          Стиль типографики
        </Label>
        <Select 
          value={formData.typography_style} 
          onValueChange={(value) => setFormData({ ...formData, typography_style: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите стиль" />
          </SelectTrigger>
          <SelectContent>
            {TYPOGRAPHY_STYLES.map((style) => (
              <SelectItem key={style.value} value={style.value}>
                <div className="flex flex-col">
                  <span>{style.label}</span>
                  <span className="text-xs text-muted-foreground">{style.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Image Style */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" />
          Стиль изображений
        </Label>
        <Select 
          value={formData.image_style} 
          onValueChange={(value) => setFormData({ ...formData, image_style: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите стиль" />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_STYLES.map((style) => (
              <SelectItem key={style.value} value={style.value}>
                <div className="flex flex-col">
                  <span>{style.label}</span>
                  <span className="text-xs text-muted-foreground">{style.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Palette */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          Цветовая палитра
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(formData.color_palette).map(([key, value]) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs capitalize text-muted-foreground">
                {key === 'primary' ? 'Основной' : 
                 key === 'secondary' ? 'Дополнительный' :
                 key === 'accent' ? 'Акцент' : 'Фон'}
              </Label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-md border border-border shrink-0 cursor-pointer"
                  style={{ backgroundColor: value }}
                  onClick={() => {
                    const input = document.getElementById(`color-${key}`) as HTMLInputElement;
                    input?.click();
                  }}
                />
                <Input
                  id={`color-${key}`}
                  type="color"
                  value={value}
                  onChange={(e) => setFormData({
                    ...formData,
                    color_palette: { ...formData.color_palette, [key]: e.target.value }
                  })}
                  className="w-0 h-0 p-0 border-0 opacity-0 absolute"
                />
                <Input
                  value={value}
                  onChange={(e) => setFormData({
                    ...formData,
                    color_palette: { ...formData.color_palette, [key]: e.target.value }
                  })}
                  className="h-8 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Preview */}
        <div 
          className="h-12 rounded-lg flex items-center justify-center gap-2 text-xs font-medium"
          style={{ 
            background: `linear-gradient(135deg, ${formData.color_palette.primary}, ${formData.color_palette.secondary})`,
            color: formData.color_palette.background
          }}
        >
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: formData.color_palette.accent }}
          />
          Превью палитры
        </div>
      </div>

      {/* Visual Keywords */}
      <div className="space-y-2">
        <Label>Ключевые слова для визуалов</Label>
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
            placeholder="Добавить ключевое слово..."
            className="flex-1"
          />
          <Button 
            type="button" 
            size="icon" 
            variant="outline"
            onClick={handleAddKeyword}
            disabled={!newKeyword.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {formData.visual_keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {formData.visual_keywords.map((keyword) => (
              <Badge 
                key={keyword} 
                variant="secondary"
                className="gap-1 pr-1"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="hover:bg-destructive/20 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full gap-2"
      >
        <Save className="w-4 h-4" />
        Сохранить стиль
      </Button>
    </div>
  );
});
