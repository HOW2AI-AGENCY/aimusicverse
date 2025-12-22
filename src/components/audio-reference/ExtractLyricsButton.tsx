/**
 * Extract Lyrics Button
 * Triggers lyrics extraction from vocal stem
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ExtractLyricsButtonProps {
  referenceId: string;
  vocalStemUrl: string | null;
}

export function ExtractLyricsButton({ referenceId, vocalStemUrl }: ExtractLyricsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleExtract = async () => {
    if (!vocalStemUrl) {
      toast.error('Вокальный стем не найден');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('extract-lyrics-from-stem', {
        body: {
          reference_id: referenceId,
          vocal_stem_url: vocalStemUrl,
        },
      });

      if (error) throw error;

      toast.success('Извлечение текста запущено');
      // Refresh the reference data
      queryClient.invalidateQueries({ queryKey: ['reference-audio', referenceId] });
    } catch (error) {
      toast.error('Ошибка: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExtract}
      disabled={isLoading || !vocalStemUrl}
      variant="outline"
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      Извлечь текст
    </Button>
  );
}
