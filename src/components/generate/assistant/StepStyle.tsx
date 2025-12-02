import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormHelper } from './FormHelper';
import { Badge } from '@/components/ui/badge';
import { Music2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepStyleProps {
  formState: any;
  updateField: (field: string, value: any) => void;
  onNext?: () => void;
}

const POPULAR_STYLES = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical',
  'Country', 'R&B', 'Metal', 'Indie', 'Folk', 'Latin',
  'Blues', 'Reggae', 'Soul', 'Funk', 'Ambient', 'Lo-fi'
];

const MOODS = [
  'Energetic', 'Calm', 'Happy', 'Sad', 'Angry', 'Romantic',
  'Melancholic', 'Uplifting', 'Dark', 'Peaceful'
];

export function StepStyle({ formState, updateField, onNext }: StepStyleProps) {
  const selectedStyles = (formState.styles as string[]) || [];
  const selectedMoods = (formState.moods as string[]) || [];

  const toggleStyle = (style: string) => {
    const newStyles = selectedStyles.includes(style)
      ? selectedStyles.filter((s) => s !== style)
      : [...selectedStyles, style];
    updateField('styles', newStyles);
  };

  const toggleMood = (mood: string) => {
    const newMoods = selectedMoods.includes(mood)
      ? selectedMoods.filter((m) => m !== mood)
      : [...selectedMoods, mood];
    updateField('moods', newMoods);
  };

  return (
    <div className="space-y-6">
      {/* Style Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Music2 className="h-5 w-5 text-primary" />
          <Label className="text-base">Music Style</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_STYLES.map((style) => {
            const isSelected = selectedStyles.includes(style);
            return (
              <Badge
                key={style}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all hover:scale-105',
                  isSelected && 'shadow-md'
                )}
                onClick={() => toggleStyle(style)}
              >
                {style}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Mood Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <Label className="text-base">Mood & Emotion</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => {
            const isSelected = selectedMoods.includes(mood);
            return (
              <Badge
                key={mood}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all hover:scale-105',
                  isSelected && 'shadow-md'
                )}
                onClick={() => toggleMood(mood)}
              >
                {mood}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Custom Style Description */}
      <div className="space-y-4">
        <Label htmlFor="style-description">
          Additional Style Details (optional)
        </Label>
        <Textarea
          id="style-description"
          placeholder="e.g., 80s synth-pop with dreamy atmosphere and reverb-heavy production"
          value={formState.styleDescription || ''}
          onChange={(e) => updateField('styleDescription', e.target.value)}
          className="min-h-[100px] resize-none"
        />
        <FormHelper
          tips={[
            'Mention specific instruments or sounds',
            'Reference similar artists or songs',
            'Describe the production style',
            'Include tempo or rhythm details',
          ]}
          examples={[
            '90s grunge with distorted guitars and heavy drums',
            'Lofi hip-hop beats with vinyl crackle and jazz samples',
            'Epic orchestral soundtrack with sweeping strings',
          ]}
        />
      </div>

      {/* Preview Selected */}
      {(selectedStyles.length > 0 || selectedMoods.length > 0) && (
        <div className="p-4 rounded-lg bg-muted/50 border-dashed border-2">
          <p className="text-sm font-medium mb-2">Your Selection:</p>
          <p className="text-sm text-muted-foreground">
            {selectedStyles.length > 0 && (
              <span>
                <strong>Styles:</strong> {selectedStyles.join(', ')}
                {selectedMoods.length > 0 && ' • '}
              </span>
            )}
            {selectedMoods.length > 0 && (
              <span>
                <strong>Moods:</strong> {selectedMoods.join(', ')}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
