/**
 * PresetsManager - Professional presets and templates management
 * Provides quick access to effect presets, mix templates, and custom settings
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Sparkles, Save, Trash2, Download, Upload, 
  Star, StarOff, Music, Sliders, Zap, Check,
  Guitar, Mic, Drum, Piano, Headphones, Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: 'eq' | 'compressor' | 'reverb' | 'mix' | 'custom';
  icon: React.ElementType;
  color: string;
  isFavorite: boolean;
  isBuiltIn: boolean;
  settings: Record<string, number | string | boolean>;
  tags: string[];
  createdAt: string;
  usageCount: number;
}

interface PresetsManagerProps {
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
  onSavePreset: (name: string, settings: Record<string, unknown>) => void;
  onDeletePreset: (presetId: string) => void;
  onToggleFavorite: (presetId: string) => void;
  onExportPresets: () => void;
  onImportPresets: (file: File) => void;
  currentSettings?: Record<string, unknown>;
}

const categoryIcons = {
  eq: Sliders,
  compressor: Zap,
  reverb: Sparkles,
  mix: Music,
  custom: Star,
};

const categoryColors = {
  eq: 'from-purple-500 to-pink-500',
  compressor: 'from-amber-500 to-orange-500',
  reverb: 'from-cyan-500 to-blue-500',
  mix: 'from-green-500 to-emerald-500',
  custom: 'from-indigo-500 to-purple-500',
};

const genrePresets = [
  { label: 'Rock', icon: Guitar, color: 'text-red-400' },
  { label: 'Pop', icon: Mic, color: 'text-pink-400' },
  { label: 'Electronic', icon: Zap, color: 'text-cyan-400' },
  { label: 'Hip-Hop', icon: Drum, color: 'text-amber-400' },
  { label: 'Classical', icon: Piano, color: 'text-purple-400' },
  { label: 'Jazz', icon: Music, color: 'text-green-400' },
];

export function PresetsManager({
  presets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onToggleFavorite,
  onExportPresets,
  onImportPresets,
  currentSettings,
}: PresetsManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Filter presets
  const filteredPresets = presets.filter((preset) => {
    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
    const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         preset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort by favorites first, then by usage count
  const sortedPresets = [...filteredPresets].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.usageCount - a.usageCount;
  });

  const handleSaveCurrentPreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Введите название пресета');
      return;
    }
    
    if (!currentSettings) {
      toast.error('Нет текущих настроек для сохранения');
      return;
    }

    onSavePreset(newPresetName, currentSettings);
    setNewPresetName('');
    setShowSaveDialog(false);
    toast.success('Пресет сохранён', {
      description: `"${newPresetName}" добавлен в вашу библиотеку`,
    });
  };

  const handleApplyPreset = (preset: Preset) => {
    onApplyPreset(preset);
    toast.success('Пресет применён', {
      description: preset.name,
      icon: <Check className="w-4 h-4 text-green-400" />,
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportPresets(file);
      toast.success('Пресеты импортированы');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Библиотека пресетов</h3>
            <p className="text-xs text-muted-foreground">
              {sortedPresets.length} из {presets.length} пресетов
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onExportPresets}
            className="h-8"
          >
            <Download className="w-4 h-4 mr-1" />
            Экспорт
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => document.getElementById('import-presets')?.click()}
            className="h-8"
          >
            <Upload className="w-4 h-4 mr-1" />
            Импорт
          </Button>
          <input
            id="import-presets"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Поиск пресетов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px] h-9">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            <SelectItem value="eq">EQ</SelectItem>
            <SelectItem value="compressor">Compressor</SelectItem>
            <SelectItem value="reverb">Reverb</SelectItem>
            <SelectItem value="mix">Mix Templates</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Genre Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs text-muted-foreground shrink-0">Жанры:</span>
        {genrePresets.map((genre) => {
          const Icon = genre.icon;
          return (
            <Button
              key={genre.label}
              variant="outline"
              size="sm"
              className="h-7 px-2 shrink-0"
              onClick={() => setSearchQuery(genre.label)}
            >
              <Icon className={cn('w-3 h-3 mr-1', genre.color)} />
              <span className="text-xs">{genre.label}</span>
            </Button>
          );
        })}
      </div>

      <Separator />

      {/* Presets Grid */}
      <ScrollArea className="h-[500px] pr-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedPresets.map((preset, index) => {
            const Icon = preset.icon;
            const CategoryIcon = categoryIcons[preset.category];
            
            return (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    'group relative cursor-pointer transition-all hover:shadow-lg border-2',
                    preset.isFavorite && 'border-amber-500/30 bg-amber-500/5'
                  )}
                  onClick={() => handleApplyPreset(preset)}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <motion.div
                          className={cn(
                            'p-2 rounded-lg',
                            `bg-gradient-to-br ${categoryColors[preset.category]}`
                          )}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-tight mb-0.5">
                            {preset.name}
                          </h4>
                          <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(preset.id);
                          }}
                        >
                          {preset.isFavorite ? (
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ) : (
                            <StarOff className="w-3 h-3 text-muted-foreground" />
                          )}
                        </Button>
                        {!preset.isBuiltIn && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePreset(preset.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {preset.category}
                      </Badge>
                      {preset.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {preset.tags.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          +{preset.tags.length - 2}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Headphones className="w-3 h-3" />
                        {preset.usageCount} раз
                      </span>
                      {preset.isBuiltIn && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                          Built-in
                        </Badge>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4 rounded-lg">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" className="h-7 text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Применить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(JSON.stringify(preset.settings));
                            toast.success('Настройки скопированы');
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {sortedPresets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              Пресеты не найдены
            </p>
            <p className="text-xs text-muted-foreground">
              Попробуйте изменить фильтры или создайте новый пресет
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Save Current Settings */}
      {currentSettings && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <AnimatePresence mode="wait">
              {!showSaveDialog ? (
                <motion.div
                  key="save-button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Текущие настройки</p>
                      <p className="text-xs text-muted-foreground">
                        Сохраните как новый пресет
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    className="h-8"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Сохранить
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="save-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <Label htmlFor="preset-name" className="text-sm">
                      Название пресета
                    </Label>
                    <Input
                      id="preset-name"
                      placeholder="Например: My Rock Mix"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveCurrentPreset}
                      className="h-8 flex-1"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Сохранить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowSaveDialog(false);
                        setNewPresetName('');
                      }}
                      className="h-8"
                    >
                      Отмена
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
