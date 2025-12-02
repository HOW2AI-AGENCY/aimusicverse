import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormHelper } from './FormHelper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  FileText, 
  Image, 
  ArrowRight, 
  FolderOpen, 
  UserCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepPromptProps {
  formState: any;
  updateField: (field: string, value: any) => void;
  onNext?: () => void;
}

const MODES = [
  {
    id: 'prompt',
    icon: Music,
    title: 'Single Prompt',
    description: 'Describe your music in a few words',
    badge: 'Quick',
  },
  {
    id: 'style-lyrics',
    icon: FileText,
    title: 'Style + Lyrics',
    description: 'Provide style and custom lyrics',
    badge: 'Detailed',
  },
  {
    id: 'cover',
    icon: Image,
    title: 'Cover Song',
    description: 'Create a cover of existing music',
    badge: 'Remix',
  },
  {
    id: 'extend',
    icon: ArrowRight,
    title: 'Extend Track',
    description: 'Continue from an existing track',
    badge: 'Extend',
  },
  {
    id: 'project',
    icon: FolderOpen,
    title: 'From Project',
    description: 'Generate from a project template',
    badge: 'Pro',
  },
  {
    id: 'persona',
    icon: UserCircle,
    title: 'From Persona',
    description: 'Use an artist persona style',
    badge: 'Artist',
  },
];

export function StepPrompt({ formState, updateField, onNext }: StepPromptProps) {
  const selectedMode = formState.mode;

  const handleModeSelect = (modeId: string) => {
    updateField('mode', modeId);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="space-y-4">
        <Label className="text-base">What do you want to create?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <Card
                key={mode.id}
                className={cn(
                  'p-4 cursor-pointer transition-all hover:shadow-md',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'hover:border-primary/50'
                )}
                onClick={() => handleModeSelect(mode.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{mode.title}</h3>
                      <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">
                        {mode.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{mode.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Prompt (Optional for first step) */}
      {selectedMode === 'prompt' && (
        <div className="space-y-4">
          <Label htmlFor="prompt">Describe your music (optional)</Label>
          <Textarea
            id="prompt"
            placeholder="e.g., Energetic pop song about summer adventures"
            value={formState.prompt || ''}
            onChange={(e) => updateField('prompt', e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <FormHelper
            tips={[
              'Be specific about genre, mood, and theme',
              'Mention instruments or vocal style',
              'Include tempo or energy level',
            ]}
            examples={[
              'Upbeat electronic dance track with female vocals',
              'Melancholic piano ballad in the style of Ludovico Einaudi',
              'Rock anthem with powerful guitar riffs and drums',
            ]}
          />
        </div>
      )}

      {/* Help Text */}
      <Card className="p-4 bg-muted/50 border-dashed">
        <div className="flex gap-3">
          <div className="p-2 rounded-lg bg-primary/10 h-fit">
            <Music className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-medium">Next Steps</p>
            <p className="text-muted-foreground">
              {selectedMode === 'prompt'
                ? 'You can add more details in the next steps, or generate directly from here.'
                : 'Complete the following steps to provide more details for your generation.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
