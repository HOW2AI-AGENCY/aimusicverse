import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'GuitarAnalysis' });

export interface BeatData {
  time: number;
  beatNumber: number;
}

export interface NoteData {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
  noteName: string;
}

export interface ChordData {
  chord: string;
  startTime: number;
  endTime: number;
}

export interface StyleAnalysis {
  genre?: string;
  mood?: string;
  technique?: string;
  key?: string;
  strummingPattern?: string;
  features?: string[];
  chordProgression?: string;
}

export interface StrumData {
  time: number;
  direction: 'U' | 'D';
}

export interface TranscriptionFiles {
  midiUrl?: string;
  midiQuantUrl?: string;
  pdfUrl?: string;
  gp5Url?: string;
  musicXmlUrl?: string;
}

export interface GuitarAnalysisResult {
  // Beat detection from Klangio
  beats: BeatData[];
  downbeats: number[];
  bpm: number;
  timeSignature: string;
  
  // Notes from transcription
  notes: NoteData[];
  midiUrl?: string;
  
  // Chord recognition
  chords: ChordData[];
  key: string;
  
  // Strumming pattern
  strumming: StrumData[];
  
  // Transcription files
  transcriptionFiles: TranscriptionFiles;
  
  // Generated tags for music creation
  generatedTags: string[];
  styleDescription: string;
  
  // Style analysis
  style: StyleAnalysis;
  
  // Metadata
  totalDuration: number;
  audioUrl: string;
  
  // Analysis status
  analysisComplete: {
    beats: boolean;
    chords: boolean;
    transcription: boolean;
  };
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

// Generate style description from analysis
function generateStyleDescription(analysis: Partial<GuitarAnalysisResult>): string {
  const parts: string[] = [];
  
  if (analysis.key && analysis.key !== 'Unknown') {
    parts.push(`Key: ${analysis.key}`);
  }
  
  if (analysis.bpm) {
    parts.push(`${analysis.bpm} BPM`);
  }
  
  if (analysis.chords && analysis.chords.length > 0) {
    const uniqueChords = [...new Set(analysis.chords.map(c => c.chord))];
    parts.push(`Chords: ${uniqueChords.slice(0, 6).join(' - ')}`);
  }
  
  if (analysis.style?.technique) {
    parts.push(analysis.style.technique);
  }
  
  return parts.join(', ') || 'Guitar recording';
}

// Generate tags for music generation
function generateTags(analysis: Partial<GuitarAnalysisResult>): string[] {
  const tags: string[] = ['guitar'];
  
  // BPM-based tags
  if (analysis.bpm) {
    if (analysis.bpm < 80) tags.push('slow tempo', 'ballad');
    else if (analysis.bpm < 110) tags.push('mid-tempo');
    else if (analysis.bpm < 140) tags.push('upbeat');
    else tags.push('fast tempo', 'energetic');
  }
  
  // Key-based tags
  if (analysis.key && analysis.key !== 'Unknown') {
    tags.push(analysis.key);
    if (analysis.key.includes('minor') || analysis.key.includes('m')) {
      tags.push('melancholic', 'emotional');
    } else {
      tags.push('bright', 'uplifting');
    }
  }
  
  // Chord complexity
  if (analysis.chords) {
    const uniqueChords = new Set(analysis.chords.map(c => c.chord));
    if (uniqueChords.size > 6) tags.push('complex harmony');
    if ([...uniqueChords].some(c => c.includes('7') || c.includes('9'))) {
      tags.push('jazz chords');
    }
  }
  
  // Strumming-based tags
  if (analysis.strumming && analysis.strumming.length > 0) {
    const upCount = analysis.strumming.filter(s => s.direction === 'U').length;
    const downCount = analysis.strumming.filter(s => s.direction === 'D').length;
    
    if (downCount > upCount * 2) tags.push('power strumming');
    else if (upCount > downCount) tags.push('upstroke pattern');
    else tags.push('alternating strum');
  }
  
  return [...new Set(tags)];
}

export function useGuitarAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GuitarAnalysisResult | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `guitar-${Date.now()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        setRecordedAudioUrl(url);
        setRecordedFile(file);
        toast.success('Запись завершена');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setMediaStream(stream);
      
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      toast.success('Запись началась - играйте!');
    } catch (error) {
      log.error('Microphone access error', error);
      toast.error('Нет доступа к микрофону');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMediaStream(null);
      
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    }
  }, [isRecording]);

  const analyzeGuitarRecording = useCallback(async (file?: File | null): Promise<GuitarAnalysisResult | null> => {
    const audioFile = file ?? recordedFile;
    if (!audioFile) {
      toast.error('Сначала запишите аудио');
      return null;
    }

    setIsAnalyzing(true);
    setProgress('Загрузка аудио...');
    setProgressPercent(5);
    
    try {
      log.info('Starting guitar analysis with Klangio API');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Upload audio to storage
      const fileName = `${user.id}/guitar-analysis/${Date.now()}-${audioFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, audioFile, { cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      setProgress('Анализируем ритм и биты...');
      setProgressPercent(15);

      // Run all Klangio analyses in parallel
      const [beatResult, chordResult, transcriptionResult] = await Promise.all([
        // Beat tracking
        supabase.functions.invoke('klangio-analyze', {
          body: { 
            audio_url: publicUrl, 
            mode: 'beat-tracking',
            user_id: user.id,
          },
        }).catch(e => {
          log.warn('Beat tracking failed', e);
          return { data: null, error: e };
        }),
        
        // Chord recognition with extended key detection
        supabase.functions.invoke('klangio-analyze', {
          body: { 
            audio_url: publicUrl, 
            mode: 'chord-recognition-extended',
            vocabulary: 'full',
            user_id: user.id,
          },
        }).catch(e => {
          log.warn('Chord recognition failed', e);
          return { data: null, error: e };
        }),
        
        // Guitar transcription with MIDI, GP5, and PDF outputs
        supabase.functions.invoke('klangio-analyze', {
          body: { 
            audio_url: publicUrl, 
            mode: 'transcription',
            model: 'guitar',
            outputs: ['midi', 'midi_quant', 'gp5', 'pdf', 'mxml'],
            user_id: user.id,
          },
        }).catch(e => {
          log.warn('Transcription failed', e);
          return { data: null, error: e };
        }),
      ]);

      setProgress('Обрабатываем результаты...');
      setProgressPercent(70);

      // Process beat tracking result
      let beats: BeatData[] = [];
      let downbeats: number[] = [];
      let bpm = 120;

      log.debug('Beat result:', {
        status: beatResult.data?.status,
        bpm: beatResult.data?.bpm,
        beatsCount: beatResult.data?.beats?.length || 0,
        error: beatResult.error,
      });

      if (beatResult.data?.status === 'completed') {
        bpm = beatResult.data.bpm || 120;

        if (beatResult.data.beats) {
          beats = beatResult.data.beats.map((time: number, i: number) => ({
            time,
            beatNumber: i + 1,
          }));
        }

        if (beatResult.data.downbeats) {
          downbeats = beatResult.data.downbeats;
        }
      }

      // Process chord recognition result
      let chords: ChordData[] = [];
      let key = 'Unknown';
      let strumming: StrumData[] = [];

      log.debug('Chord result:', {
        status: chordResult.data?.status,
        key: chordResult.data?.key,
        chordsCount: chordResult.data?.chords?.length || 0,
        error: chordResult.error,
      });

      if (chordResult.data?.status === 'completed') {
        key = chordResult.data.key || 'Unknown';
        
        if (chordResult.data.chords && Array.isArray(chordResult.data.chords)) {
          // Edge function already converts to objects with chord, startTime, endTime
          chords = chordResult.data.chords.map((c: any) => ({
            chord: c.chord || c.name || c.label || 'N',
            startTime: c.startTime ?? c.start_time ?? c.time ?? 0,
            endTime: c.endTime ?? c.end_time ?? (c.startTime ? c.startTime + 2 : 2),
          }));
        }
        
        if (chordResult.data.strumming && Array.isArray(chordResult.data.strumming)) {
          strumming = chordResult.data.strumming.map((s: any) => ({
            time: s.time || s.timestamp || 0,
            direction: s.direction === 'up' || s.direction === 'U' ? 'U' : 'D',
          }));
        }
      }

      // Process transcription result
      let transcriptionFiles: TranscriptionFiles = {};
      let midiUrl: string | undefined;
      let notes: NoteData[] = [];

      log.debug('Transcription result:', {
        status: transcriptionResult.data?.status,
        hasFiles: !!transcriptionResult.data?.files,
        files: transcriptionResult.data?.files,
        error: transcriptionResult.error,
      });

      if (transcriptionResult.data?.status === 'completed' && transcriptionResult.data.files) {
        const files = transcriptionResult.data.files;
        transcriptionFiles = {
          midiUrl: files.midi,
          midiQuantUrl: files.midi_quant || files.midi_unq, // API returns midi_quant (quantized MIDI)
          gp5Url: files.gp5,
          pdfUrl: files.pdf,
          musicXmlUrl: files.mxml,
        };
        midiUrl = files.midi || files.midi_quant || files.midi_unq;

        log.debug('Parsed transcription files:', { files: transcriptionFiles });
        
        // Parse notes from transcription data if available
        if (transcriptionResult.data.notes && Array.isArray(transcriptionResult.data.notes)) {
          notes = transcriptionResult.data.notes.map((n: any) => ({
            pitch: n.pitch || n.midi || 60,
            startTime: n.start_time ?? n.startTime ?? n.time ?? 0,
            endTime: n.end_time ?? n.endTime ?? (n.startTime ? n.startTime + (n.duration || 0.5) : 0.5),
            velocity: n.velocity ?? 80,
            noteName: n.note_name ?? midiToNoteName(n.pitch || n.midi || 60),
          }));
        }
      }

      // Calculate time signature from beats and downbeats
      let timeSignature = '4/4';
      if (downbeats.length >= 2 && beats.length > 0) {
        const beatsPerMeasure = Math.round(
          beats.filter(b => b.time >= downbeats[0] && b.time < downbeats[1]).length
        );
        if (beatsPerMeasure === 3) timeSignature = '3/4';
        else if (beatsPerMeasure === 6) timeSignature = '6/8';
      }

      // Estimate duration
      const totalDuration = beats.length > 0 
        ? Math.max(...beats.map(b => b.time)) + 2
        : chords.length > 0 
          ? Math.max(...chords.map(c => c.endTime)) 
          : 30;

      setProgress('Генерируем теги...');
      setProgressPercent(85);

      // Build partial result for tag generation
      const partialResult = {
        beats,
        downbeats,
        bpm,
        chords,
        key,
        strumming,
        style: {
          technique: strumming.length > 0 ? 'strumming' : 'fingerpicking',
        },
      };

      const generatedTags = generateTags(partialResult);
      const styleDescription = generateStyleDescription(partialResult);

      setProgress('Готово!');
      setProgressPercent(100);

      const result: GuitarAnalysisResult = {
        beats,
        downbeats,
        bpm,
        timeSignature,
        notes,
        midiUrl,
        chords,
        key,
        strumming,
        transcriptionFiles,
        generatedTags,
        styleDescription,
        style: partialResult.style,
        totalDuration,
        audioUrl: publicUrl,
        analysisComplete: {
          beats: beatResult.data?.status === 'completed',
          chords: chordResult.data?.status === 'completed',
          transcription: transcriptionResult.data?.status === 'completed',
        },
      };

      setAnalysisResult(result);
      setProgress('');
      setProgressPercent(0);
      
      const successParts: string[] = [];
      if (result.analysisComplete.beats) successParts.push('ритм');
      if (result.analysisComplete.chords) successParts.push('аккорды');
      if (result.analysisComplete.transcription) successParts.push('ноты');
      
      if (successParts.length > 0) {
        toast.success(`Анализ завершён: ${successParts.join(', ')}`);
      } else {
        toast.warning('Анализ частично завершён');
      }
      
      log.info('Guitar analysis complete', { 
        bpm, 
        key, 
        chordsCount: chords.length,
        beatsCount: beats.length,
        hasTranscription: !!midiUrl,
      });
      
      return result;
    } catch (error) {
      log.error('Guitar analysis error', error);
      toast.error('Ошибка анализа. Попробуйте снова.');
      setProgress('');
      setProgressPercent(0);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [recordedFile]);

  const clearRecording = useCallback(() => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    setRecordedFile(null);
    setAnalysisResult(null);
    setProgress('');
    setProgressPercent(0);
    setMediaStream(null);
  }, [recordedAudioUrl]);

  return {
    isAnalyzing,
    isRecording,
    analysisResult,
    recordedAudioUrl,
    recordedFile,
    progress,
    progressPercent,
    mediaStream,
    startRecording,
    stopRecording,
    analyzeGuitarRecording,
    clearRecording,
  };
}
