/**
 * Extract Lyrics Button
 * Triggers lyrics extraction from vocal stem
 */

import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "@/lib/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useExtractLyricsFromStem } from "@/hooks/audio-reference/useAudioReferenceGeneration";
import { toast } from "sonner";

interface ExtractLyricsButtonProps {
  referenceId: string;
  vocalStemUrl: string | null;
}

export function ExtractLyricsButton({ referenceId, vocalStemUrl }: ExtractLyricsButtonProps) {
  const queryClient = useQueryClient();
  const extractLyrics = useExtractLyricsFromStem();

  const handleExtract = async () => {
    if (!vocalStemUrl) {
      toast.error("Вокальный стем не найден");
      return;
    }

    try {
      const { error } = await extractLyrics.mutateAsync({
        referenceId,
        vocalStemUrl,
      });

      if (error) throw new Error(error.message);

      toast.success("Извлечение текста запущено");
      // Refresh the reference data
      queryClient.invalidateQueries({ queryKey: ["reference-audio", referenceId] });
    } catch (error) {
      toast.error("Ошибка: " + (error as Error).message);
    }
  };

  return (
    <Button
      onClick={handleExtract}
      disabled={extractLyrics.isPending || !vocalStemUrl}
      variant="outline"
      className="gap-2"
    >
      {extractLyrics.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
      Извлечь текст
    </Button>
  );
}
