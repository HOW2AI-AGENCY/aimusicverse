import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Filter, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface GraphFiltersProps {
  genres: string[];
  categories: string[];
  selectedGenres: string[];
  selectedCategories: string[];
  selectedNodeTypes: ('genre' | 'style' | 'tag' | 'category')[];
  onGenresChange: (genres: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  onNodeTypesChange: (types: ('genre' | 'style' | 'tag' | 'category')[]) => void;
  onReset: () => void;
}

const NODE_TYPE_LABELS: Record<string, string> = {
  genre: 'Жанры',
  style: 'Стили',
  tag: 'Теги',
  category: 'Категории',
};

const CATEGORY_LABELS: Record<string, string> = {
  structure: 'Структура',
  vocal: 'Вокал',
  instrument: 'Инструменты',
  genre_style: 'Жанр/Стиль',
  mood_energy: 'Настроение',
  production_texture: 'Текстура',
  effect_processing: 'Эффекты',
  special_effects: 'Спецэффекты',
  transition_dynamics: 'Переходы',
  format: 'Формат',
};

export function GraphFilters({
  genres,
  categories,
  selectedGenres,
  selectedCategories,
  selectedNodeTypes,
  onGenresChange,
  onCategoriesChange,
  onNodeTypesChange,
  onReset,
}: GraphFiltersProps) {
  const hasFilters = 
    selectedGenres.length > 0 || 
    selectedCategories.length > 0 || 
    selectedNodeTypes.length < 4;

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter(g => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const toggleNodeType = (type: 'genre' | 'style' | 'tag' | 'category') => {
    if (selectedNodeTypes.includes(type)) {
      if (selectedNodeTypes.length > 1) {
        onNodeTypesChange(selectedNodeTypes.filter(t => t !== type));
      }
    } else {
      onNodeTypesChange([...selectedNodeTypes, type]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Node Types */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Типы узлов
            {selectedNodeTypes.length < 4 && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {selectedNodeTypes.length}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Показывать</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(['genre', 'style', 'tag', 'category'] as const).map(type => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={selectedNodeTypes.includes(type)}
              onCheckedChange={() => toggleNodeType(type)}
            >
              {NODE_TYPE_LABELS[type]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Genres */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Жанры
            {selectedGenres.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {selectedGenres.length}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
          <DropdownMenuLabel>Фильтр по жанру</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {genres.map(genre => (
            <DropdownMenuCheckboxItem
              key={genre}
              checked={selectedGenres.includes(genre)}
              onCheckedChange={() => toggleGenre(genre)}
            >
              {genre}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Categories */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Категории тегов
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {selectedCategories.length}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
          <DropdownMenuLabel>Фильтр по категории</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categories.map(category => (
            <DropdownMenuCheckboxItem
              key={category}
              checked={selectedCategories.includes(category)}
              onCheckedChange={() => toggleCategory(category)}
            >
              {CATEGORY_LABELS[category] || category.replace(/_/g, ' ')}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Сбросить фильтры
        </Button>
      )}

      {/* Active filters */}
      <div className="flex flex-wrap gap-1 ml-2">
        {selectedGenres.map(genre => (
          <Badge 
            key={genre} 
            variant="secondary" 
            className="text-[10px] cursor-pointer hover:bg-destructive/20"
            onClick={() => toggleGenre(genre)}
          >
            {genre} ×
          </Badge>
        ))}
        {selectedCategories.map(category => (
          <Badge 
            key={category} 
            variant="secondary" 
            className="text-[10px] cursor-pointer hover:bg-destructive/20"
            onClick={() => toggleCategory(category)}
          >
            {CATEGORY_LABELS[category] || category} ×
          </Badge>
        ))}
      </div>
    </div>
  );
}
