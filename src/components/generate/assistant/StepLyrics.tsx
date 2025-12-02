import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormHelper } from './FormHelper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Sparkles, 
  Music, 
  Check 
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface StepLyricsProps {
  formState: any;
  updateField: (field: string, value: any) => void;
  onNext?: () => void;
}

const VOCAL_OPTIONS = [
  { id: 'vocal', label: 'With Vocals', description: 'Include sung or spoken lyrics' },
  { id: 'instrumental', label: 'Instrumental', description: 'Music only, no vocals' },
];

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Italian',
  'Portuguese', 'Japanese', 'Korean', 'Chinese', 'Russian'
];

export function StepLyrics({ formState, updateField, onNext }: StepLyricsProps) {
  const vocalType = formState.vocalType || 'vocal';
  const isInstrumental = vocalType === 'instrumental';
  const selectedLanguage = formState.language || 'English';

  const handleGenerateIdeas = () => {
    // TODO: Implement AI-powered lyrics generation
    const sampleLyrics = `[Verse 1]
Walking down the street tonight
City lights are shining bright
Feel the rhythm in my soul
Let the music take control

[Chorus]
This is our moment, can't you see
Dancing to our destiny
Hearts are beating, wild and free
This is where we're meant to be`;

    updateField('lyrics', sampleLyrics);
  };

  return (
    <div className="space-y-6">
      {/* Vocal Type Selection */}
      <div className="space-y-4">
        <Label className="text-base">Vocal Type</Label>
        <RadioGroup
          value={vocalType}
          onValueChange={(value) => updateField('vocalType', value)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {VOCAL_OPTIONS.map((option) => (
            <Card
              key={option.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                vocalType === option.id
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => updateField('vocalType', option.id)}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="cursor-pointer font-semibold text-sm">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
                {vocalType === option.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </Card>
          ))}
        </RadioGroup>
      </div>

      {/* Language Selection (Only for Vocal) */}
      {!isInstrumental && (
        <div className="space-y-4">
          <Label className="text-base">Lyrics Language</Label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((lang) => {
              const isSelected = selectedLanguage === lang;
              return (
                <Badge
                  key={lang}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    isSelected ? 'shadow-md' : ''
                  }`}
                  onClick={() => updateField('language', lang)}
                >
                  {lang}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Lyrics Input (Only for Vocal) */}
      {!isInstrumental && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="lyrics" className="text-base">
              Lyrics (optional)
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateIdeas}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Ideas
            </Button>
          </div>
          <Textarea
            id="lyrics"
            placeholder="Enter your lyrics here...

[Verse 1]
...

[Chorus]
...

[Verse 2]
..."
            value={formState.lyrics || ''}
            onChange={(e) => updateField('lyrics', e.target.value)}
            className="min-h-[300px] font-mono text-sm resize-none"
          />
          <FormHelper
            tips={[
              'Use song structure markers: [Verse], [Chorus], [Bridge], etc.',
              'Keep lines concise and singable',
              'Consider rhythm and rhyme scheme',
              'Match the mood you selected earlier',
            ]}
            examples={[
              '[Verse 1]\nWalking through the night\nStars are shining bright\n\n[Chorus]\nThis is our time to shine\nYour heart beats next to mine',
              '[Intro]\nOoh, ooh, yeah\n\n[Verse 1]\nSummer breeze, ocean waves\nMemories of brighter days',
            ]}
          />
        </div>
      )}

      {/* Instrumental Info */}
      {isInstrumental && (
        <Card className="p-4 bg-muted/50 border-dashed">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-primary/10 h-fit">
              <Music className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">Instrumental Track</p>
              <p className="text-muted-foreground">
                Your track will be created without vocals, focusing on the musical composition and instrumentation.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Character Count */}
      {!isInstrumental && formState.lyrics && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {formState.lyrics.length} / 5000 characters
          </span>
          <span>
            {formState.lyrics.split('\n').filter((line: string) => line.trim()).length} lines
          </span>
        </div>
      )}
    </div>
  );
}
