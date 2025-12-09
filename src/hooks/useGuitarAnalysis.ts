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
  fullResponse?: string;
}

export interface StrumData {
  time: number;
  direction: 'U' | 'D';
}

export interface TranscriptionFiles {
  midiUrl?: string;
  pdfUrl?: string;
  gp5Url?: string;
  musicXmlUrl?: string;
}

export interface GuitarAnalysisResult {
  // Beat detection
  beats: BeatData[];
  bpm: number;
  timeSignature: string;
  downbeats: number[];
  
  // MIDI transcription
  notes: NoteData[];
  midiUrl?: string;
  
  // Style analysis
  style: StyleAnalysis;
  chords: ChordData[];
  key: string;
  
  // Klangio extended data
  klangioKey?: string;
  strumming?: StrumData[];
  transcriptionFiles?: TranscriptionFiles;
  
  // Generated tags
  generatedTags: string[];
  styleDescription: string;
  
  // Metadata
  totalDuration: number;
  audioUrl: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

// Parse chords from Audio Flamingo response
function parseChords(text: string, duration: number): ChordData[] {
  const chords: ChordData[] = [];
  
  // Try to find chord timing patterns like "Am (0:00-0:02)"
  const timingPattern = /([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]|7|9|11|13)?)\s*\((\d+):(\d+)-(\d+):(\d+)\)/gi;
  let match;
  
  while ((match = timingPattern.exec(text)) !== null) {
    const chord = match[1];
    const startMin = parseInt(match[2]);
    const startSec = parseInt(match[3]);
    const endMin = parseInt(match[4]);
    const endSec = parseInt(match[5]);
    
    chords.push({
      chord,
      startTime: startMin * 60 + startSec,
      endTime: endMin * 60 + endSec,
    });
  }
  
  // Fallback: extract chord names and distribute evenly
  if (chords.length === 0) {
    const chordPattern = /(?:Chords?:\s*)?([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]|7)?(?:\s*[-–]\s*[A-G][#b]?(?:m|maj|min|dim|aug|sus[24]|7)?)+)/gi;
    const progressionMatch = text.match(chordPattern);
    
    if (progressionMatch) {
      const progressionStr = progressionMatch[0];
      const chordNames = progressionStr.match(/[A-G][#b]?(?:m|maj|min|dim|aug|sus[24]|7)?/gi) || [];
      
      const segmentLength = duration / (chordNames.length || 1);
      chordNames.forEach((chord, i) => {
        chords.push({
          chord,
          startTime: i * segmentLength,
          endTime: (i + 1) * segmentLength,
        });
      });
    }
  }
  
  return chords;
}

// Parse style analysis from Audio Flamingo response
function parseStyleAnalysis(text: string): StyleAnalysis {
  const parseField = (fieldName: string): string | undefined => {
    const patterns = [
      new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, 'i'),
      new RegExp(`\\*\\*${fieldName}\\*\\*[:\\s]+([^\\n]+)`, 'i'),
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return undefined;
  };
  
  const features: string[] = [];
  const featuresMatch = text.match(/Notable Features?[:\s]+([^\n]+)/i);
  if (featuresMatch) {
    features.push(...featuresMatch[1].split(/[,;]/).map(f => f.trim()).filter(Boolean));
  }
  
  return {
    genre: parseField('Genre'),
    mood: parseField('Mood'),
    technique: parseField('(?:Playing )?Technique'),
    key: parseField('Key'),
    strummingPattern: parseField('Strumming Pattern'),
    chordProgression: parseField('Chord Progression'),
    features,
    fullResponse: text,
  };
}

export function useGuitarAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GuitarAnalysisResult | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<string>('');
  
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
    
    try {
      log.info('Starting guitar analysis');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Upload audio
      const fileName = `${user.id}/guitar-analysis/${Date.now()}-${audioFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, audioFile, { cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      // Run all analyses in parallel
      setProgress('Анализируем биты, ноты и стиль...');
      
      const [beatResult, midiResult, styleResult, klangioChords, klangioTranscription] = await Promise.all([
        // Beat detection
        supabase.functions.invoke('detect-beats', {
          body: { audio_url: publicUrl, constant_tempo: false },
        }),
        
        // MIDI transcription
        supabase.functions.invoke('transcribe-midi', {
          body: { audio_url: publicUrl, model_type: 'basic-pitch' },
        }),
        
        // Style analysis with guitar-specific prompt
        supabase.functions.invoke('analyze-audio-flamingo', {
          body: { 
            audio_url: publicUrl, 
            analysis_type: 'guitar_chord',
            custom_prompt: `Analyze this guitar recording and provide structured information:

Chords: [List all chords with approximate timing, e.g., "Am (0:00-0:02), G (0:02-0:04)"]
Chord Progression: [e.g., "Am - G - F - C"]
Playing Technique: [fingerpicking/strumming/hybrid/arpeggios/tapping]
Key: [detected key, e.g., "A minor", "C major"]
Strumming Pattern: [if applicable, describe the pattern]
Mood: [overall mood/emotion]
Genre: [detected genre/style]
Notable Features: [bends, slides, hammer-ons, pull-offs, harmonics, etc.]

Be precise with chord names including extensions (e.g., Am7, Cmaj7, Dsus4).
Provide timing estimates in MM:SS format.`,
          },
        }),
        
        // Klangio chord recognition extended (for strumming detection)
        supabase.functions.invoke('klangio-analyze', {
          body: { 
            audio_url: publicUrl, 
            mode: 'chord-recognition-extended',
            vocabulary: 'full',
            user_id: user.id,
          },
        }).catch(e => {
          log.warn('Klangio chord recognition failed', e);
          return { data: null };
        }),
        
        // Klangio transcription (for Guitar Pro export)
        supabase.functions.invoke('klangio-analyze', {
          body: { 
            audio_url: publicUrl, 
            mode: 'transcription',
            model: 'guitar',
            outputs: ['midi', 'gp5'],
            user_id: user.id,
          },
        }).catch(e => {
          log.warn('Klangio transcription failed', e);
          return { data: null };
        }),
      ]);

      // Process beat detection result
      let beats: BeatData[] = [];
      let bpm = 120;
      let timeSignature = '4/4';
      let downbeats: number[] = [];
      let totalDuration = 30;

      if (beatResult.data?.success && beatResult.data?.analysis) {
        const beatAnalysis = beatResult.data.analysis;
        beats = beatAnalysis.beats || [];
        bpm = beatAnalysis.bpm || 120;
        timeSignature = beatAnalysis.timeSignature || '4/4';
        downbeats = beatAnalysis.downbeats || [];
        totalDuration = beatAnalysis.totalDuration || 30;
      }

      // Process MIDI result
      let notes: NoteData[] = [];
      let midiUrl: string | undefined;

      if (midiResult.data?.success) {
        midiUrl = midiResult.data.midi_url;
        // Generate synthetic notes if needed
        // In production, parse actual MIDI data
      }

      // Process style analysis result
      let style: StyleAnalysis = {};
      let chords: ChordData[] = [];
      let key = 'Unknown';

      if (styleResult.data?.success) {
        const fullResponse = styleResult.data?.analysis?.full_response || 
                            styleResult.data?.parsed?.style_description || '';
        style = parseStyleAnalysis(fullResponse);
        chords = parseChords(fullResponse, totalDuration);
        key = style.key || styleResult.data?.parsed?.key_signature || 'Unknown';
      }

      // Process Klangio results
      let klangioKey: string | undefined;
      let strumming: StrumData[] = [];
      let transcriptionFiles: TranscriptionFiles = {};

      if (klangioChords.data?.status === 'completed') {
        klangioKey = klangioChords.data.key;
        if (klangioChords.data.strumming) {
          strumming = klangioChords.data.strumming.map((s: any) => ({
            time: s.time || s.timestamp || 0,
            direction: s.direction === 'up' || s.direction === 'U' ? 'U' : 'D',
          }));
        }
        // Merge Klangio chords if available
        if (klangioChords.data.chords?.length > 0 && chords.length === 0) {
          chords = klangioChords.data.chords.map((c: any) => ({
            chord: c.chord || c.name,
            startTime: c.start_time || c.time || 0,
            endTime: c.end_time || (c.time + 2),
          }));
        }
        // Use Klangio key if more reliable
        if (klangioKey && key === 'Unknown') {
          key = klangioKey;
        }
      }

      if (klangioTranscription.data?.status === 'completed' && klangioTranscription.data.files) {
        transcriptionFiles = {
          midiUrl: klangioTranscription.data.files.midi,
          gp5Url: klangioTranscription.data.files.gp5,
          pdfUrl: klangioTranscription.data.files.pdf,
          musicXmlUrl: klangioTranscription.data.files.musicxml,
        };
        // Prefer Klangio MIDI if available
        if (transcriptionFiles.midiUrl && !midiUrl) {
          midiUrl = transcriptionFiles.midiUrl;
        }
      }

      // Generate tags using melody-to-tags
      setProgress('Генерируем теги...');
      
      const { data: tagsData } = await supabase.functions.invoke('melody-to-tags', {
        body: {
          notes,
          chords,
          bpm,
          key,
          timeSignature,
          instrument: 'guitar',
        },
      });

      const generatedTags = tagsData?.tags || [];
      const styleDescription = tagsData?.styleDescription || '';

      const result: GuitarAnalysisResult = {
        beats,
        bpm,
        timeSignature,
        downbeats,
        notes,
        midiUrl,
        style,
        chords,
        key,
        klangioKey,
        strumming,
        transcriptionFiles,
        generatedTags,
        styleDescription,
        totalDuration,
        audioUrl: publicUrl,
      };

      setAnalysisResult(result);
      setProgress('');
      toast.success('Анализ завершён!');
      
      log.info('Guitar analysis complete', { 
        bpm, 
        key, 
        chordsCount: chords.length,
        beatsCount: beats.length,
      });
      
      return result;
    } catch (error) {
      log.error('Guitar analysis error', error);
      toast.error('Ошибка анализа');
      setProgress('');
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
  }, [recordedAudioUrl]);

  return {
    isAnalyzing,
    isRecording,
    analysisResult,
    recordedAudioUrl,
    recordedFile,
    progress,
    startRecording,
    stopRecording,
    analyzeGuitarRecording,
    clearRecording,
  };
}
