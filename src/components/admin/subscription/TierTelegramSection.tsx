/**
 * Tier Telegram Section
 * 
 * Cover URL and detailed description for Telegram bot.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Music } from 'lucide-react';
import { EditableTierFields } from '@/hooks/admin/useSubscriptionTiers';

interface TierTelegramSectionProps {
  editedTier: EditableTierFields;
  onUpdateField: <K extends keyof EditableTierFields>(field: K, value: EditableTierFields[K]) => void;
  onUpdateNestedField: (field: 'detailed_description', key: string, value: string) => void;
}

export function TierTelegramSection({ 
  editedTier, 
  onUpdateField,
  onUpdateNestedField
}: TierTelegramSectionProps) {
  const coverUrl = editedTier.cover_url;
  const detailedDescriptionRu = (editedTier.detailed_description as Record<string, string> | undefined)?.ru ?? '';

  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <Music className="h-4 w-4" />
        Telegram бот
      </h3>
      
      <div className="space-y-2">
        <Label>URL обложки</Label>
        <Input
          placeholder="https://example.com/cover.jpg"
          value={coverUrl ?? ''}
          onChange={(e) => onUpdateField('cover_url', e.target.value || null)}
        />
        {coverUrl && (
          <img 
            src={coverUrl} 
            alt="Preview" 
            className="w-full h-32 object-cover rounded-lg mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Детальное описание (RU)</Label>
        <Textarea
          placeholder="Полное описание тарифа для Telegram..."
          rows={6}
          value={detailedDescriptionRu}
          onChange={(e) => onUpdateNestedField('detailed_description', 'ru', e.target.value)}
        />
      </div>
    </div>
  );
}
