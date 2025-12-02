import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Music, 
  FileText, 
  Sparkles, 
  Link as LinkIcon,
  Edit,
  Check 
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface StepReviewProps {
  formState: any;
  updateField: (field: string, value: any) => void;
  onNext?: () => void;
}

export function StepReview({ formState, updateField, onNext }: StepReviewProps) {
  const {
    mode,
    styles,
    moods,
    styleDescription,
    vocalType,
    language,
    lyrics,
    referenceType,
    referenceUrl,
    referenceFile,
  } = formState;

  const sections = [
    {
      title: 'Generation Mode',
      icon: Music,
      content: mode ? mode.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified',
    },
    {
      title: 'Style & Mood',
      icon: Sparkles,
      content: (
        <div className="space-y-2">
          {styles && styles.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Styles:</p>
              <div className="flex flex-wrap gap-1">
                {styles.map((style: string) => (
                  <Badge key={style} variant="secondary" className="text-xs">
                    {style}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {moods && moods.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Moods:</p>
              <div className="flex flex-wrap gap-1">
                {moods.map((mood: string) => (
                  <Badge key={mood} variant="secondary" className="text-xs">
                    {mood}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {styleDescription && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description:</p>
              <p className="text-sm">{styleDescription}</p>
            </div>
          )}
          {!styles?.length && !moods?.length && !styleDescription && (
            <p className="text-sm text-muted-foreground">No style specified</p>
          )}
        </div>
      ),
    },
    {
      title: 'Vocals & Lyrics',
      icon: FileText,
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={vocalType === 'vocal' ? 'default' : 'secondary'}>
              {vocalType === 'vocal' ? 'With Vocals' : 'Instrumental'}
            </Badge>
            {vocalType === 'vocal' && language && (
              <Badge variant="outline">{language}</Badge>
            )}
          </div>
          {lyrics && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Lyrics Preview:</p>
              <pre className="text-xs font-mono whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                {lyrics.length > 200 ? lyrics.substring(0, 200) + '...' : lyrics}
              </pre>
            </div>
          )}
          {!lyrics && vocalType === 'vocal' && (
            <p className="text-sm text-muted-foreground">AI will generate lyrics</p>
          )}
        </div>
      ),
    },
    {
      title: 'Reference Audio',
      icon: LinkIcon,
      content: (
        <div className="space-y-2">
          {referenceType === 'none' ? (
            <p className="text-sm text-muted-foreground">No reference audio</p>
          ) : (
            <>
              <Badge variant="secondary">{referenceType.toUpperCase()}</Badge>
              {referenceUrl && (
                <p className="text-xs truncate">{referenceUrl}</p>
              )}
              {referenceFile && (
                <p className="text-xs truncate">{referenceFile}</p>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Review Your Generation</h3>
        <p className="text-sm text-muted-foreground">
          Check all the details before generating your track
        </p>
      </div>

      <Separator />

      {/* Review Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index} className="p-4">
              <div className="space-y-3">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-sm">{section.title}</h4>
                  </div>
                  {/* TODO: Add edit functionality */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>

                {/* Section Content */}
                <div className="pl-8">
                  {typeof section.content === 'string' ? (
                    <p className="text-sm">{section.content}</p>
                  ) : (
                    section.content
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Generation Info */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex gap-3">
          <div className="p-2 rounded-lg bg-primary/20 h-fit">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-medium">Ready to Generate!</p>
            <p className="text-muted-foreground">
              Click "Generate" to create your track. This usually takes 30-60 seconds.
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                ~45s generation time
              </Badge>
              <Badge variant="outline" className="text-xs">
                High quality output
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Estimated Cost/Credits Info */}
      <div className="text-center text-xs text-muted-foreground">
        <p>
          Generation will use <strong>1 credit</strong>. You have{' '}
          <strong>10 credits</strong> remaining.
        </p>
      </div>
    </div>
  );
}
