/**
 * TrackTechnicalSection - Technical information grid
 */

import { memo } from 'react';
import { Cpu } from 'lucide-react';
import type { Track } from '@/types/track';

interface TrackTechnicalSectionProps {
  track: Track;
}

// Format model name for display
const formatModelName = (model: string | null) => {
  if (!model) return null;
  const modelLabels: Record<string, string> = {
    'V5': 'Suno V5 (Crow)',
    'V4_5ALL': 'Suno V4.5',
    'V4': 'Suno V4',
    'V3_5': 'Suno V3.5',
  };
  return modelLabels[model] || model;
};

interface TechInfoItemProps {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
  mono?: boolean;
}

const TechInfoItem = memo(function TechInfoItem({ label, value, fullWidth, mono }: TechInfoItemProps) {
  return (
    <div className={`p-3 rounded-lg bg-muted/30 ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</p>
    </div>
  );
});

export const TrackTechnicalSection = memo(function TrackTechnicalSection({ track }: TrackTechnicalSectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-lg">Техническая информация</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {track.suno_model && (
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Модель</p>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <p className="font-medium text-sm">{formatModelName(track.suno_model)}</p>
            </div>
          </div>
        )}

        {track.generation_mode && (
          <TechInfoItem label="Режим генерации" value={track.generation_mode} />
        )}

        {track.vocal_gender && (
          <TechInfoItem label="Пол вокала" value={<span className="capitalize">{track.vocal_gender}</span>} />
        )}

        {track.style_weight !== undefined && track.style_weight !== null && (
          <TechInfoItem label="Style Weight" value={track.style_weight} />
        )}

        {track.provider && (
          <TechInfoItem label="Провайдер" value={track.provider} />
        )}

        {track.created_at && (
          <TechInfoItem 
            label="Дата создания" 
            value={new Date(track.created_at).toLocaleString('ru-RU')} 
            fullWidth 
          />
        )}

        {track.suno_id && (
          <TechInfoItem label="Suno ID" value={track.suno_id} fullWidth mono />
        )}
      </div>
    </div>
  );
});
