import { useState } from 'react';
import { Download, FileAudio, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { TrackStem } from '@/hooks/useTrackStems';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface StemDownloadPanelProps {
  stems: TrackStem[];
  trackTitle: string;
}

const stemLabels: Record<string, string> = {
  vocals: 'Вокал',
  vocal: 'Вокал',
  backing_vocals: 'Бэк-вокал',
  drums: 'Ударные',
  bass: 'Бас',
  guitar: 'Гитара',
  keyboard: 'Клавишные',
  piano: 'Пианино',
  strings: 'Струнные',
  brass: 'Духовые',
  woodwinds: 'Дер. духовые',
  percussion: 'Перкуссия',
  synth: 'Синтезатор',
  fx: 'Эффекты',
  atmosphere: 'Атмосфера',
  instrumental: 'Инструментал',
  other: 'Другое',
};

const getStemLabel = (stemType: string): string => {
  return stemLabels[stemType.toLowerCase()] || stemType;
};

const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-zA-Zа-яА-Я0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
};

export const StemDownloadPanel = ({ stems, trackTitle }: StemDownloadPanelProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);

  const downloadSingleStem = async (stem: TrackStem, format: 'mp3' | 'wav') => {
    try {
      setIsDownloading(true);
      const stemLabel = getStemLabel(stem.stem_type);
      setDownloadProgress(`Скачиваю ${stemLabel}...`);

      const response = await fetch(stem.audio_url);
      if (!response.ok) throw new Error('Failed to fetch audio');
      
      const blob = await response.blob();
      const filename = `${sanitizeFilename(trackTitle)}_${sanitizeFilename(stemLabel)}.${format}`;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${stemLabel} скачан`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Ошибка скачивания');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const downloadAllStems = async (format: 'mp3' | 'wav') => {
    try {
      setIsDownloading(true);
      const zip = new JSZip();
      const folder = zip.folder(sanitizeFilename(trackTitle));
      
      if (!folder) throw new Error('Failed to create folder');

      for (let i = 0; i < stems.length; i++) {
        const stem = stems[i];
        const stemLabel = getStemLabel(stem.stem_type);
        setDownloadProgress(`Скачиваю ${stemLabel} (${i + 1}/${stems.length})...`);
        
        const response = await fetch(stem.audio_url);
        if (!response.ok) throw new Error(`Failed to fetch ${stemLabel}`);
        
        const blob = await response.blob();
        const filename = `${sanitizeFilename(stemLabel)}.${format}`;
        folder.file(filename, blob);
      }

      setDownloadProgress('Создаю архив...');
      const content = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFilename(trackTitle)}_stems.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Все стемы скачаны');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Ошибка скачивания');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          disabled={isDownloading}
        >
          <Download className="w-4 h-4" />
          {downloadProgress || 'Скачать'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Скачать все стемы</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => downloadAllStems('mp3')}>
          <Package className="w-4 h-4 mr-2" />
          Все стемы (MP3)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadAllStems('wav')}>
          <Package className="w-4 h-4 mr-2" />
          Все стемы (WAV)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Отдельные стемы</DropdownMenuLabel>
        
        {stems.map((stem) => (
          <DropdownMenu key={stem.id}>
            <DropdownMenuTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <FileAudio className="w-4 h-4 mr-2" />
                {getStemLabel(stem.stem_type)}
              </DropdownMenuItem>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left">
              <DropdownMenuItem onClick={() => downloadSingleStem(stem, 'mp3')}>
                MP3
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadSingleStem(stem, 'wav')}>
                WAV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
