import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PresetBrowser } from './PresetBrowser';
import { QuickCreatePreset } from '@/constants/quickCreatePresets';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

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
      const params = new URLSearchParams({
        preset: selectedPreset.id,
        style: selectedPreset.defaultParams.style,
        mood: selectedPreset.defaultParams.mood,
        tempo: selectedPreset.defaultParams.tempo.toString(),
        instruments: selectedPreset.defaultParams.instruments.join(','),
      });

      navigate(`/generate?${params.toString()}`);
      logger.info('Quick Create: Navigating to generation with preset', { presetId: selectedPreset.id });
    } catch (error) {
      logger.error('Quick Create: Failed to navigate', error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Quick Create</h2>
        <p className="text-muted-foreground">
          Start creating music instantly with professionally curated presets
        </p>
      </div>

      <PresetBrowser onPresetSelect={handlePresetSelect} />

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
              Generate Track
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
