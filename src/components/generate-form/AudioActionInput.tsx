import { Button } from "@/components/ui/button";
import { Upload, Mic, Guitar } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/player-utils";
import { CloudAudioSelector } from "@/components/audio-reference";
import { GuitarModeRecorder } from "./GuitarModeRecorder";
import { ReferenceAudio } from "@/hooks/useReferenceAudio";

type AudioMode = "cover" | "extend";

interface AudioActionInputProps {
  mode: AudioMode;
  isRecording: boolean;
  recordingTime: number;
  showGuitarMode: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onShowGuitarMode: () => void;
  onGuitarRecordingComplete: (data: {
    audioFile: File;
    audioUrl: string;
    chordProgression: string[];
    styleDescription: string;
    useMode: "style" | "audio";
  }) => void;
  onCancelGuitarMode: () => void;
  onCloudSelect: (audio: ReferenceAudio) => void;
}

export function AudioActionInput({
  mode,
  isRecording,
  recordingTime,
  showGuitarMode,
  onFileUpload,
  onStartRecording,
  onStopRecording,
  onShowGuitarMode,
  onGuitarRecordingComplete,
  onCancelGuitarMode,
  onCloudSelect,
}: AudioActionInputProps) {
  if (showGuitarMode) {
    return (
      <GuitarModeRecorder
        onRecordingComplete={onGuitarRecordingComplete}
        onCancel={onCancelGuitarMode}
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* Cloud Audio Selector */}
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
        <input
          id="audio-file-input-dialog"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={onFileUpload}
        />

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
          onClick={onShowGuitarMode}
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
