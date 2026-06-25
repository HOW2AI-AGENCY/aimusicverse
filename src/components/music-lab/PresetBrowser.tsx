import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "@/lib/icons";
import { PresetCard } from "./PresetCard";
import { QUICK_CREATE_PRESETS, QuickCreatePreset } from "@/constants/quickCreatePresets";

interface PresetBrowserProps {
  onSelectPreset: (preset: QuickCreatePreset) => void;
  selectedPresetId?: string;
}

export function PresetBrowser({ onSelectPreset, selectedPresetId }: PresetBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredPresets = QUICK_CREATE_PRESETS.filter((preset) => {
    const matchesSearch =
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === "all" || preset.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "🎵 Все" },
    { value: "rock", label: "🎸 Рок" },
    { value: "pop", label: "🎤 Поп" },
    { value: "electronic", label: "🥁 Электро" },
    { value: "jazz", label: "🎺 Джаз" },
    { value: "classical", label: "🎻 Классика" },
    { value: "hip-hop", label: "🎧 Хип-Хоп" },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск пресетов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full grid grid-cols-4 lg:grid-cols-7">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="text-xs sm:text-sm">
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPresets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onSelect={onSelectPreset}
            isSelected={preset.id === selectedPresetId}
          />
        ))}
      </div>
      {filteredPresets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Пресеты не найдены</p>
          <p className="text-sm">Попробуйте изменить поисковый запрос или категорию</p>
        </div>
      )}
    </div>
  );
}
