import { Button } from "@/components/ui/button";
import { Upload, Mic, Guitar } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/player-utils";
import { CloudAudioSelector } from "@/components/audio-reference";
import type { ReferenceAudio } from "@/hooks/useReferenceAudio";
import type { AudioMode } from "./AudioActionModeTabsSection";

interface AudioActionUploadSectionProps {
  mode: AudioMode;
  onCloudSelect: (audio: ReferenceAudio) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onGuitarMode: () => void;
}

/** Entry point for supplying reference audio: cloud history, upload, mic recording, or guitar mode. */
export function AudioActionUploadSection({
  mode,
  onCloudSelect,
  onFileUpload,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onGuitarMode,
}: AudioActionUploadSectionProps) {
  return (
    <div className="space-y-2">
      {/* Cloud Audio Selector - integrated with unified reference system */}
      <CloudAudioSelector selectedMode={mode} onSelect={onCloudSelect} maxItems={5} compact />

      {/* Upload/Record Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-14 flex-col gap-1"
          onClick={() => document.getElementById("audio-file-input-dialog")?.click()}
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs">Загрузить</span>
        </Button>
        <input id="audio-file-input-dialog" type="file" accept="audio/*" className="hidden" onChange={onFileUpload} />

        <Button
          type="button"
          variant={isRecording ? "destructive" : "outline"}
          className="h-14 flex-col gap-1"
          onClick={isRecording ? onStopRecording : onStartRecording}
        >
          <Mic className={cn("w-5 h-5", isRecording && "animate-pulse")} />
          <span className="text-xs">{isRecording ? formatTime(recordingTime) : "Записать"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-14 flex-col gap-1 border-primary/30 hover:border-primary hover:bg-primary/5"
          onClick={onGuitarMode}
        >
          <Guitar className="w-5 h-5 text-primary" />
          <span className="text-xs">Гитара</span>
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        WAV, MP3, WebM • до 20 МБ • Гитара: детектирование аккордов
      </p>
    </div>
  );
}
