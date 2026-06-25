/**
 * AudioHubUploader - Drag & drop file upload with batch analysis
 */

import React, { useState, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Upload, FileAudio, X, Sparkles, Check, AlertCircle, Play, Pause, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  file: File;
  url: string;
  status: "pending" | "analyzing" | "done" | "error";
  progress?: number;
  analysisResult?: any;
  error?: string;
}

const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const AudioHubUploader = memo(function AudioHubUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles: UploadedFile[] = [];

    Array.from(newFiles).forEach((file) => {
      // Validate type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: неподдерживаемый формат`);
        return;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: файл слишком большой (макс. 50MB)`);
        return;
      }

      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
        status: "pending",
      });
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      toast.success(`Добавлено файлов: ${validFiles.length}`);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
    },
    [addFiles],
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const file = prev.find((f) => f.id === id);
        if (file) {
          URL.revokeObjectURL(file.url);
        }
        return prev.filter((f) => f.id !== id);
      });
      if (playingId === id) {
        audioRef.current?.pause();
        setPlayingId(null);
      }
    },
    [playingId],
  );

  const togglePlay = useCallback(
    (file: UploadedFile) => {
      if (playingId === file.id) {
        audioRef.current?.pause();
        setPlayingId(null);
      } else {
        if (audioRef.current) {
          audioRef.current.src = file.url;
          audioRef.current.play();
        } else {
          audioRef.current = new Audio(file.url);
          audioRef.current.play();
          audioRef.current.onended = () => setPlayingId(null);
        }
        setPlayingId(file.id);
      }
    },
    [playingId],
  );

  const analyzeAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) {
      toast.info("Нет файлов для анализа");
      return;
    }

    toast.info(`Анализируем ${pendingFiles.length} файлов...`);

    for (const file of pendingFiles) {
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "analyzing", progress: 0 } : f)));

      // Simulate analysis progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((r) => setTimeout(r, 300));
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress: i } : f)));
      }

      // Mock analysis result
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: "done",
                progress: 100,
                analysisResult: {
                  bpm: Math.floor(80 + Math.random() * 80),
                  key: ["C", "D", "E", "F", "G", "A", "B"][Math.floor(Math.random() * 7)],
                  scale: Math.random() > 0.5 ? "major" : "minor",
                },
              }
            : f,
        ),
      );
    }

    toast.success("Анализ завершён!");
  }, [files]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-200 cursor-pointer",
          isDragging && "ring-2 ring-primary border-primary",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />

          <motion.div
            animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
            className="flex flex-col items-center justify-center text-center"
          >
            <div className={cn("p-4 rounded-full mb-4 transition-colors", isDragging ? "bg-primary/20" : "bg-muted")}>
              <Upload
                className={cn("h-8 w-8 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")}
              />
            </div>
            <h3 className="font-medium mb-1">{isDragging ? "Отпустите для загрузки" : "Перетащите аудио файлы"}</h3>
            <p className="text-sm text-muted-foreground mb-3">или нажмите для выбора файлов</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {["MP3", "WAV", "OGG", "WebM"].map((fmt) => (
                <Badge key={fmt} variant="outline" className="text-xs">
                  {fmt}
                </Badge>
              ))}
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileAudio className="h-4 w-4" />
                    Загруженные файлы ({files.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      analyzeAll();
                    }}
                    disabled={files.every((f) => f.status !== "pending")}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Анализировать все
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-2">
                    {files.map((file) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
                      >
                        {/* Play button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => togglePlay(file)}
                        >
                          {playingId === file.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{file.file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.file.size)}</span>
                            {file.analysisResult && (
                              <>
                                <span>•</span>
                                <span>{file.analysisResult.bpm} BPM</span>
                                <span>•</span>
                                <span>
                                  {file.analysisResult.key} {file.analysisResult.scale}
                                </span>
                              </>
                            )}
                          </div>
                          {file.status === "analyzing" && <Progress value={file.progress} className="h-1 mt-1" />}
                        </div>

                        {/* Status */}
                        <div className="shrink-0">
                          {file.status === "done" && (
                            <Badge variant="secondary" className="gap-1">
                              <Check className="h-3 w-3" />
                              Готово
                            </Badge>
                          )}
                          {file.status === "analyzing" && (
                            <Badge variant="default" className="gap-1">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Sparkles className="h-3 w-3" />
                              </motion.div>
                              Анализ
                            </Badge>
                          )}
                          {file.status === "error" && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Ошибка
                            </Badge>
                          )}
                        </div>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(file.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AudioHubUploader;
