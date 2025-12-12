import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PresetBrowser } from './PresetBrowser';
import { QuickCreatePreset } from '@/constants/quickCreatePresets';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { CheckCircle, Circle } from 'lucide-react';

interface QuickCreateProps {
  onPresetSelect?: (preset: QuickCreatePreset) => void;
}

export function QuickCreate({ onPresetSelect }: QuickCreateProps) {
  const [selectedPreset, setSelectedPreset] = useState<QuickCreatePreset | null>(null);
  const navigate = useNavigate();

  const handlePresetSelect = (preset: QuickCreatePreset) => {
    setSelectedPreset(preset);
    if (onPresetSelect) {
      onPresetSelect(preset);
    }
  };

  const handleQuickGenerate = () => {
    if (!selectedPreset) return;

    try {
      // Navigate to generate page with preset params
      const params = new URLSearchParams();
      params.set('preset', selectedPreset.id);
      if (selectedPreset.defaultParams.style) params.set('style', selectedPreset.defaultParams.style);
      if (selectedPreset.defaultParams.mood) params.set('mood', selectedPreset.defaultParams.mood);
      if (selectedPreset.defaultParams.tempo) params.set('tempo', selectedPreset.defaultParams.tempo);
      if (selectedPreset.defaultParams.instruments) params.set('instruments', selectedPreset.defaultParams.instruments.join(','));

      navigate(`/generate?${params.toString()}`);
      logger.info('Quick Create: Navigating to generation with preset', { presetId: selectedPreset.id });
    } catch (error) {
      logger.error('Quick Create: Failed to navigate', error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with 4-Step Process Indicator */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Quick Create</h2>
          <p className="text-muted-foreground">
            Start creating music instantly with professionally curated presets
          </p>
        </div>

        {/* 4-Step Flow Visualization */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            {selectedPreset ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={selectedPreset ? 'text-green-500 font-medium' : 'text-muted-foreground'}>
              1. Select Preset
            </span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-1.5">
            <Circle className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">2. Customize</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-1.5">
            <Circle className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">3. Generate</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-1.5">
            <Circle className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">4. Studio</span>
          </div>
        </div>
      </div>

      <PresetBrowser onSelectPreset={handlePresetSelect} />

      {selectedPreset && (
        <div className="sticky bottom-0 left-0 right-0 p-4 glass-mobile rounded-lg border border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {selectedPreset.icon} {selectedPreset.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {selectedPreset.description}
              </p>
            </div>
            <Button
              onClick={handleQuickGenerate}
              size="lg"
              className="shrink-0"
            >
              Next Step →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
