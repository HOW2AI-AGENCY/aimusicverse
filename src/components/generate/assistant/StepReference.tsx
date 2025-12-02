import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormHelper } from './FormHelper';
import { 
  Upload, 
  Link as LinkIcon, 
  Music, 
  Check, 
  X,
  FileAudio 
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface StepReferenceProps {
  formState: any;
  updateField: (field: string, value: any) => void;
  onNext?: () => void;
}

const REFERENCE_TYPES = [
  { id: 'none', label: 'No Reference', description: 'Generate from scratch' },
  { id: 'url', label: 'Audio URL', description: 'Use an external audio link' },
  { id: 'upload', label: 'Upload File', description: 'Upload your own audio' },
  { id: 'track', label: 'Your Track', description: 'Use one of your tracks' },
];

export function StepReference({ formState, updateField, onNext }: StepReferenceProps) {
  const referenceType = formState.referenceType || 'none';
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // TODO: Implement file upload to storage
      const mockUrl = URL.createObjectURL(file);
      updateField('referenceUrl', mockUrl);
      updateField('referenceFile', file.name);
      
      // TODO: Remove setTimeout and implement actual upload
      setTimeout(() => {
        setUploading(false);
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }
  };

  const clearReference = () => {
    updateField('referenceUrl', '');
    updateField('referenceFile', '');
  };

  const hasReference = formState.referenceUrl || formState.referenceFile;

  return (
    <div className="space-y-6">
      {/* Reference Type Selection */}
      <div className="space-y-4">
        <Label className="text-base">Reference Audio (optional)</Label>
        <RadioGroup
          value={referenceType}
          onValueChange={(value) => updateField('referenceType', value)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {REFERENCE_TYPES.map((option) => (
            <Card
              key={option.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                referenceType === option.id
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => updateField('referenceType', option.id)}
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
                {referenceType === option.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </Card>
          ))}
        </RadioGroup>
      </div>

      {/* URL Input */}
      {referenceType === 'url' && (
        <div className="space-y-4">
          <Label htmlFor="reference-url">Audio URL</Label>
          <div className="flex gap-2">
            <Input
              id="reference-url"
              type="url"
              placeholder="https://example.com/audio.mp3"
              value={formState.referenceUrl || ''}
              onChange={(e) => updateField('referenceUrl', e.target.value)}
              className="flex-1"
            />
            {hasReference && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearReference}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <FormHelper
            tips={[
              'Supports MP3, WAV, and other audio formats',
              'URL must be publicly accessible',
              'File size should be under 50MB',
            ]}
          />
        </div>
      )}

      {/* File Upload */}
      {referenceType === 'upload' && (
        <div className="space-y-4">
          <Label htmlFor="reference-file">Upload Audio File</Label>
          
          {!hasReference ? (
            <label
              htmlFor="reference-file"
              className="flex flex-col items-center justify-center w-full h-32 px-4 transition border-2 border-dashed rounded-lg appearance-none cursor-pointer hover:border-primary/50 focus:outline-none"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  MP3, WAV, FLAC (MAX. 50MB)
                </p>
              </div>
              <Input
                id="reference-file"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          ) : (
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileAudio className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {formState.referenceFile}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {uploading ? 'Uploading...' : 'Ready to use'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearReference}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Track Selector */}
      {referenceType === 'track' && (
        <div className="space-y-4">
          <Label>Select from Your Library</Label>
          <Card className="p-4 bg-muted/50 border-dashed">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <Music className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">Library Integration</p>
                <p className="text-muted-foreground">
                  Feature coming soon! You'll be able to select tracks from your library.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* No Reference Info */}
      {referenceType === 'none' && (
        <Card className="p-4 bg-muted/50 border-dashed">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-primary/10 h-fit">
              <Music className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">Original Creation</p>
              <p className="text-muted-foreground">
                Your track will be generated from scratch based on your style and lyrics inputs.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Reference Usage Info */}
      {referenceType !== 'none' && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <strong>How it's used:</strong> The reference audio will guide the style, tempo, and instrumentation of your generated track.
          </p>
        </div>
      )}
    </div>
  );
}
