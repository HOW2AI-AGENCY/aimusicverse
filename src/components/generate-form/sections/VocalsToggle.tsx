import { memo } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic } from 'lucide-react';

interface VocalsToggleProps {
  hasVocals: boolean;
  onHasVocalsChange: (value: boolean) => void;
  onLyricsChange: (value: string) => void;
}

export const VocalsToggle = memo(function VocalsToggle({
  hasVocals,
  onHasVocalsChange,
  onLyricsChange,
}: VocalsToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4" />
        <Label htmlFor="vocals-toggle" className="cursor-pointer text-sm font-medium">
          С вокалом
        </Label>
      </div>
      <Switch
        id="vocals-toggle"
        checked={hasVocals}
        onCheckedChange={(checked) => {
          onHasVocalsChange(checked);
          if (!checked) {
            onLyricsChange('');
          }
        }}
      />
    </div>
  );
});
