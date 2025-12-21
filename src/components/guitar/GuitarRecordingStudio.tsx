/**
 * GuitarRecordingStudio - Full-featured guitar recording with transcription
 * 
 * Features:
 * - Audio recording from microphone
 * - Real-time chord detection
 * - Transcription to notes, tabs, MIDI, GP5
 * - Cloud storage for recordings and files
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Mic, MicOff, Guitar, Music, Waves, FileAudio, Download,
  Play, Pause, Trash2, FileMusic, FileText, Loader2, Save,
  CheckCircle2, AlertCircle, Music2, FileDown
} from 'lucide-react';
import { useRealtimeChordDetection } from '@/hooks/useRealtimeChordDetection';
import { useAudioLevel } from '@/hooks/useAudioLevel';
import { ChordDiagram } from '@/components/guitar/ChordDiagram';
import { LiveChordDisplay } from '@/components/guitar/LiveChordDisplay';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { notifyTranscriptionComplete } from '@/services/notificationManager';

interface TranscriptionResult {
  midiUrl?: string;
  midiQuantUrl?: string;
  gp5Url?: string;
  pdfUrl?: string;
  musicXmlUrl?: string;
  notes?: Array<{
    pitch: number;
    startTime: number;
    endTime: number;
    velocity: number;
    noteName: string;
  }>;
  bpm?: number;
  key?: string;
  timeSignature?: string;
}

interface GuitarRecordingStudioProps {
  onComplete?: (data: {
    audioUrl: string;
    transcription?: TranscriptionResult;
    chords: string[];
  }) => void;
  compact?: boolean;
}

export function GuitarRecordingStudio({ onComplete, compact = false }: GuitarRecordingStudioProps) {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState('');
  
  // Transcription state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState('');
  const [transcriptionPercent, setTranscriptionPercent] = useState(0);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  
  // Upload state
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecordingId, setSavedRecordingId] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Real-time chord detection
  const {
    currentChord,
    chordHistory,
    chromagram,
    isListening,
    isInitializing,
    volume,
    startListening,
    stopListening,
    clearHistory,
  } = useRealtimeChordDetection({
    minConfidence: 0.5,
    stabilityFrames: 2,
    maxHistory: 50,
  });

  // Audio level for visualization
  const audioLevel = useAudioLevel(streamRef.current, isRecording);

  // Start recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        },
      });
      
      streamRef.current = stream;
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        const file = new File([blob], `guitar-${Date.now()}.${ext}`, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        setRecordedFile(file);
        setRecordedAudioUrl(url);
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);
      clearHistory();
      setTranscriptionResult(null);
      setSavedRecordingId(null);
      
      // Start chord detection
      await startListening();
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
      
      if (navigator.vibrate) navigator.vibrate(50);
      toast.success('Запись началась — играйте!');
      
    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Не удалось получить доступ к микрофону');
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsRecording(false);
      stopListening();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      toast.success('Запись завершена');
    }
  };

  // Clear recording
  const handleClear = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedFile(null);
    setRecordedAudioUrl(null);
    setRecordingDuration(0);
    setTranscriptionResult(null);
    setSavedRecordingId(null);
    clearHistory();
  };

  // Toggle playback
  const handleTogglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Transcribe recording
  const handleTranscribe = async () => {
    if (!recordedFile) {
      toast.error('Сначала запишите аудио');
      return;
    }
    
    setIsTranscribing(true);
    setTranscriptionProgress('Загрузка аудио...');
    setTranscriptionPercent(5);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Войдите в аккаунт для транскрипции');
        return;
      }
      
      // Upload audio to storage
      const fileName = `${user.id}/guitar-recordings/${Date.now()}-${recordedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, recordedFile, { cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      setTranscriptionProgress('Анализируем биты и ритм...');
      setTranscriptionPercent(15);

      // Run all analyses in parallel
      const [beatResult, chordResult, transcriptionResult] = await Promise.all([
        supabase.functions.invoke('klangio-analyze', {
          body: { 
            audio_url: publicUrl, 
            mode: 'beat-tracking',
            user_id: user.id,
          },
        }).catch(e => ({ data: null, error: e })),
        
        supabase.functions.invoke('klangio-analyze', {
          body: { 
            audio_url: publicUrl, 
            mode: 'chord-recognition-extended',
            vocabulary: 'full',
            user_id: user.id,
          },
        }).catch(e => ({ data: null, error: e })),
        
        supabase.functions.invoke('klangio-analyze', {
          body: { 
            audio_url: publicUrl, 
            mode: 'transcription',
            model: 'guitar',
            outputs: ['midi', 'midi_quant', 'gp5', 'pdf', 'mxml'],
            user_id: user.id,
          },
        }).catch(e => ({ data: null, error: e })),
      ]);

      setTranscriptionProgress('Обрабатываем результаты...');
      setTranscriptionPercent(70);

      // Parse results
      const result: TranscriptionResult = {
        bpm: beatResult.data?.bpm || 120,
        timeSignature: beatResult.data?.time_signature || '4/4',
        key: chordResult.data?.key || 'Unknown',
      };

      // Get transcription files
      if (transcriptionResult.data?.status === 'completed' && transcriptionResult.data.files) {
        const files = transcriptionResult.data.files;
        result.midiUrl = files.midi;
        result.midiQuantUrl = files.midi_quant;
        result.gp5Url = files.gp5;
        result.pdfUrl = files.pdf;
        result.musicXmlUrl = files.mxml;
        
        if (transcriptionResult.data.notes) {
          result.notes = transcriptionResult.data.notes;
        }
      }

      setTranscriptionProgress('Готово!');
      setTranscriptionPercent(100);
      setTranscriptionResult(result);
      
      const successParts: string[] = [];
      const formats: string[] = [];
      if (beatResult.data?.status === 'completed') successParts.push('ритм');
      if (chordResult.data?.status === 'completed') successParts.push('аккорды');
      if (transcriptionResult.data?.status === 'completed') {
        successParts.push('ноты');
        if (result.midiUrl) formats.push('MIDI');
        if (result.gp5Url) formats.push('Guitar Pro');
        if (result.pdfUrl) formats.push('PDF');
        if (result.musicXmlUrl) formats.push('MusicXML');
      }
      
      toast.success(`Транскрипция завершена: ${successParts.join(', ')}`);
      
      // Send notification about transcription
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && formats.length > 0) {
        notifyTranscriptionComplete(
          currentUser.id,
          recordingTitle || 'Гитарная запись',
          formats
        );
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Ошибка транскрипции');
    } finally {
      setIsTranscribing(false);
      setTranscriptionProgress('');
      setTranscriptionPercent(0);
    }
  };

  // Save to database
  const handleSave = async () => {
    if (!recordedFile || !recordedAudioUrl) {
      toast.error('Нет записи для сохранения');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Войдите в аккаунт для сохранения');
        return;
      }
      
      // Upload audio if not already uploaded
      let audioUrl = '';
      const fileName = `${user.id}/guitar-recordings/${Date.now()}-${recordedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, recordedFile, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);
      
      audioUrl = publicUrl;

      // Save to guitar_recordings table
      const { data: recording, error: dbError } = await supabase
        .from('guitar_recordings')
        .insert({
          user_id: user.id,
          audio_url: audioUrl,
          title: recordingTitle || `Запись ${new Date().toLocaleDateString('ru')}`,
          duration_seconds: recordingDuration,
          bpm: transcriptionResult?.bpm || null,
          key: transcriptionResult?.key || null,
          time_signature: transcriptionResult?.timeSignature || null,
          chords: chordHistory.map((c, i) => ({
            chord: c.name,
            start: i * 2, // Approximate timing based on position
            confidence: c.confidence,
          })),
          midi_url: transcriptionResult?.midiUrl || null,
          midi_quant_url: transcriptionResult?.midiQuantUrl || null,
          gp5_url: transcriptionResult?.gp5Url || null,
          pdf_url: transcriptionResult?.pdfUrl || null,
          musicxml_url: transcriptionResult?.musicXmlUrl || null,
          notes: transcriptionResult?.notes || null,
          generated_tags: generateTags(),
          style_description: generateStyleDescription(),
          analysis_status: transcriptionResult ? { status: 'completed' } : { status: 'pending' },
        })
        .select('id')
        .single();

      if (dbError) throw dbError;
      
      setSavedRecordingId(recording.id);
      toast.success('Запись сохранена в облако');
      
      onComplete?.({
        audioUrl,
        transcription: transcriptionResult || undefined,
        chords: [...new Set(chordHistory.map(c => c.name))],
      });
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate tags from analysis
  const generateTags = (): string[] => {
    const tags: string[] = ['guitar'];
    
    if (transcriptionResult?.bpm) {
      const bpm = transcriptionResult.bpm;
      if (bpm < 80) tags.push('slow', 'ballad');
      else if (bpm < 110) tags.push('mid-tempo');
      else if (bpm < 140) tags.push('upbeat');
      else tags.push('fast', 'energetic');
    }
    
    if (transcriptionResult?.key) {
      tags.push(transcriptionResult.key);
      if (transcriptionResult.key.includes('m') || transcriptionResult.key.includes('minor')) {
        tags.push('melancholic');
      }
    }
    
    const uniqueChords = new Set(chordHistory.map(c => c.name));
    if (uniqueChords.size > 6) tags.push('complex harmony');
    if ([...uniqueChords].some(c => c.includes('7'))) tags.push('jazz');
    
    return [...new Set(tags)];
  };

  // Generate style description
  const generateStyleDescription = (): string => {
    const parts: string[] = ['Acoustic guitar'];
    
    if (transcriptionResult?.key && transcriptionResult.key !== 'Unknown') {
      parts.push(`Key: ${transcriptionResult.key}`);
    }
    if (transcriptionResult?.bpm) {
      parts.push(`${transcriptionResult.bpm} BPM`);
    }
    
    const uniqueChords = [...new Set(chordHistory.map(c => c.name))].slice(0, 4);
    if (uniqueChords.length > 0) {
      parts.push(`Chords: ${uniqueChords.join(' - ')}`);
    }
    
    return parts.join(', ');
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Download file
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Скачивание ${filename}`);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      stopListening();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);


  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Recording Section */}
      {!recordedAudioUrl ? (
        <Card className={cn(
          "transition-all",
          isRecording && "border-destructive bg-destructive/5"
        )}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-4">
              {/* Recording Button */}
              <div className="relative">
                <motion.button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isInitializing}
                  className={cn(
                    "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center",
                    "transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
                    isRecording 
                      ? "bg-destructive hover:bg-destructive/90 focus:ring-destructive" 
                      : "bg-primary hover:bg-primary/90 focus:ring-primary"
                  )}
                  animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {isInitializing ? (
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="w-8 h-8 sm:w-10 sm:h-10 text-destructive-foreground" />
                  ) : (
                    <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
                  )}
                </motion.button>
                
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-destructive"
                    animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Status */}
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {isRecording ? (
                    <span className="text-destructive font-mono text-xl">
                      {formatDuration(recordingDuration)}
                    </span>
                  ) : (
                    'Запись гитары'
                  )}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRecording 
                    ? 'Играйте — аккорды определяются в реальном времени' 
                    : 'Нажмите для начала записи с микрофона'
                  }
                </p>
              </div>

              {/* Audio Level */}
              {isRecording && (
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-destructive"
                      style={{ width: `${audioLevel}%` }}
                      animate={{ width: `${audioLevel}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Chord Detection */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <LiveChordDisplay
                  currentChord={currentChord}
                  chromagram={chromagram}
                  chordHistory={chordHistory}
                  volume={volume}
                  isListening={isListening}
                />
              </motion.div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Recorded Audio */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Audio Player Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant={isPlaying ? "secondary" : "default"}
                  onClick={handleTogglePlayback}
                  className="h-12 w-12 rounded-full shrink-0"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                
                <div className="flex-1 min-w-0">
                  <Input
                    value={recordingTitle}
                    onChange={(e) => setRecordingTitle(e.target.value)}
                    placeholder="Название записи"
                    className="h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDuration(recordingDuration)} • {chordHistory.length} аккордов
                  </p>
                </div>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleClear}
                  className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
              
              <audio
                ref={audioRef}
                src={recordedAudioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Detected Chords */}
          {chordHistory.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Определённые аккорды</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set(chordHistory.map(c => c.name))].map((chord, i) => (
                    <Badge key={i} variant="secondary">{chord}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcription Progress */}
          {isTranscribing && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{transcriptionProgress}</p>
                    <Progress value={transcriptionPercent} className="h-2 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcription Result */}
          {transcriptionResult && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Транскрипция готова
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {/* Analysis Info */}
                <div className="flex flex-wrap gap-2">
                  {transcriptionResult.bpm && (
                    <Badge variant="outline">
                      <Music2 className="w-3 h-3 mr-1" />
                      {transcriptionResult.bpm} BPM
                    </Badge>
                  )}
                  {transcriptionResult.key && transcriptionResult.key !== 'Unknown' && (
                    <Badge variant="outline">
                      <Music className="w-3 h-3 mr-1" />
                      {transcriptionResult.key}
                    </Badge>
                  )}
                  {transcriptionResult.timeSignature && (
                    <Badge variant="outline">{transcriptionResult.timeSignature}</Badge>
                  )}
                  {transcriptionResult.notes && (
                    <Badge variant="outline">
                      {transcriptionResult.notes.length} нот
                    </Badge>
                  )}
                </div>

                {/* Download Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {transcriptionResult.midiUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDownload(transcriptionResult.midiUrl!, 'guitar.mid')}
                    >
                      <FileAudio className="w-4 h-4" />
                      MIDI
                    </Button>
                  )}
                  {transcriptionResult.gp5Url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDownload(transcriptionResult.gp5Url!, 'guitar.gp5')}
                    >
                      <Guitar className="w-4 h-4" />
                      Guitar Pro
                    </Button>
                  )}
                  {transcriptionResult.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDownload(transcriptionResult.pdfUrl!, 'notes.pdf')}
                    >
                      <FileText className="w-4 h-4" />
                      PDF Ноты
                    </Button>
                  )}
                  {transcriptionResult.musicXmlUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDownload(transcriptionResult.musicXmlUrl!, 'music.xml')}
                    >
                      <FileMusic className="w-4 h-4" />
                      MusicXML
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            {!transcriptionResult && (
              <Button
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="gap-2"
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Music className="w-4 h-4" />
                )}
                Транскрибировать
              </Button>
            )}
            
            <Button
              onClick={handleSave}
              disabled={isSaving || !!savedRecordingId}
              variant={savedRecordingId ? "outline" : "default"}
              className={cn("gap-2", !transcriptionResult && "col-span-1")}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : savedRecordingId ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {savedRecordingId ? 'Сохранено' : 'Сохранить'}
            </Button>

            {transcriptionResult && (
              <Button
                variant="outline"
                onClick={handleClear}
                className="gap-2"
              >
                <Mic className="w-4 h-4" />
                Новая запись
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
