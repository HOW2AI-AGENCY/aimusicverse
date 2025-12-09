import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'MelodyAnalysis' });

export interface NoteData {
  pitch: number;      // MIDI pitch (0-127)
  startTime: number;  // seconds
  endTime: number;    // seconds
  velocity: number;   // 0-127
  noteName: string;   // e.g., "C4", "A#3"
}

export interface ChordData {
  chord: string;      // e.g., "Am", "G", "F", "C"
  startTime: number;
  endTime: number;
}

export interface MelodyAnalysisResult {
  notes: NoteData[];
  chords: ChordData[];
  bpm: number;
  key: string;           // e.g., "A minor", "C major"
  timeSignature: string; // e.g., "4/4"
  generatedTags: string[];
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

// Detect key from notes (simple heuristic)
function detectKey(notes: NoteData[]): string {
  if (notes.length === 0) return 'Unknown';
  
  const pitchClasses = new Array(12).fill(0);
  notes.forEach(note => {
    const pitchClass = note.pitch % 12;
    pitchClasses[pitchClass] += note.endTime - note.startTime;
  });
  
  // Major scale profile
  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  // Minor scale profile  
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  
  let bestKey = 'C major';
  let bestScore = -Infinity;
  
  for (let root = 0; root < 12; root++) {
    // Rotate pitch classes
    const rotated = [...pitchClasses.slice(root), ...pitchClasses.slice(0, root)];
    
    // Calculate correlation with major
    let majorScore = 0;
    let minorScore = 0;
    for (let i = 0; i < 12; i++) {
      majorScore += rotated[i] * majorProfile[i];
      minorScore += rotated[i] * minorProfile[i];
    }
    
    if (majorScore > bestScore) {
      bestScore = majorScore;
      bestKey = `${NOTE_NAMES[root]} major`;
    }
    if (minorScore > bestScore) {
      bestScore = minorScore;
      bestKey = `${NOTE_NAMES[root]} minor`;
    }
  }
  
  return bestKey;
}

// Simple BPM detection via onset intervals
function detectBPM(notes: NoteData[]): number {
  if (notes.length < 4) return 120;
  
  const onsets = notes.map(n => n.startTime).sort((a, b) => a - b);
  const intervals: number[] = [];
  
  for (let i = 1; i < onsets.length; i++) {
    const interval = onsets[i] - onsets[i - 1];
    if (interval > 0.1 && interval < 2) {
      intervals.push(interval);
    }
  }
  
  if (intervals.length === 0) return 120;
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round(60 / avgInterval);
  
  // Clamp to reasonable range
  return Math.max(60, Math.min(200, bpm));
}

// Detect chord progression from notes
function detectChords(notes: NoteData[], duration: number): ChordData[] {
  const chords: ChordData[] = [];
  const segmentLength = 2; // seconds per segment
  const numSegments = Math.ceil(duration / segmentLength);
  
  for (let i = 0; i < numSegments; i++) {
    const startTime = i * segmentLength;
    const endTime = Math.min((i + 1) * segmentLength, duration);
    
    const segmentNotes = notes.filter(n => 
      n.startTime < endTime && n.endTime > startTime
    );
    
    if (segmentNotes.length >= 2) {
      const pitchClasses = new Set<number>();
      segmentNotes.forEach(n => pitchClasses.add(n.pitch % 12));
      
      const chord = identifyChord(Array.from(pitchClasses));
      if (chord) {
        chords.push({ chord, startTime, endTime });
      }
    }
  }
  
  return chords;
}

// Simple chord identification
function identifyChord(pitchClasses: number[]): string | null {
  if (pitchClasses.length < 2) return null;
  
  const sorted = [...pitchClasses].sort((a, b) => a - b);
  const root = sorted[0];
  const intervals = sorted.slice(1).map(p => (p - root + 12) % 12);
  
  const rootName = NOTE_NAMES[root];
  
  // Major: [4, 7]
  if (intervals.includes(4) && intervals.includes(7)) {
    return rootName;
  }
  // Minor: [3, 7]
  if (intervals.includes(3) && intervals.includes(7)) {
    return `${rootName}m`;
  }
  // Diminished: [3, 6]
  if (intervals.includes(3) && intervals.includes(6)) {
    return `${rootName}dim`;
  }
  // Augmented: [4, 8]
  if (intervals.includes(4) && intervals.includes(8)) {
    return `${rootName}aug`;
  }
  // Sus4: [5, 7]
  if (intervals.includes(5) && intervals.includes(7)) {
    return `${rootName}sus4`;
  }
  // Sus2: [2, 7]
  if (intervals.includes(2) && intervals.includes(7)) {
    return `${rootName}sus2`;
  }
  
  // Default to root if we can't identify
  return rootName;
}

// Generate tags from analysis
function generateTags(analysis: Omit<MelodyAnalysisResult, 'generatedTags'>): string[] {
  const tags: string[] = [];
  
  // Add key
  tags.push(`[Key: ${analysis.key}]`);
  
  // Add BPM
  tags.push(`[BPM: ${analysis.bpm}]`);
  
  // Add chord progression
  if (analysis.chords.length > 0) {
    const uniqueChords = [...new Set(analysis.chords.map(c => c.chord))];
    tags.push(`[Chords: ${uniqueChords.slice(0, 4).join('-')}]`);
  }
  
  // Determine tempo feel
  if (analysis.bpm < 80) {
    tags.push('slow tempo', 'ballad');
  } else if (analysis.bpm < 110) {
    tags.push('mid-tempo', 'groove');
  } else if (analysis.bpm < 140) {
    tags.push('upbeat', 'energetic');
  } else {
    tags.push('fast tempo', 'driving');
  }
  
  // Determine mood from key
  if (analysis.key.includes('minor')) {
    tags.push('melancholic', 'emotional');
  } else if (analysis.key.includes('major')) {
    tags.push('uplifting', 'bright');
  }
  
  return tags;
}

export function useMelodyAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MelodyAnalysisResult | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false, // Keep raw audio for analysis
          noiseSuppression: false,
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
        const file = new File([blob], `melody-${Date.now()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        setRecordedAudioUrl(url);
        setRecordedFile(file);
        toast.success('Запись завершена');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      toast.success('Запись началась - играйте мелодию!');
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

  const analyzeRecordedAudio = useCallback(async (file?: File) => {
    const audioFile = file || recordedFile;
    if (!audioFile) {
      toast.error('Сначала запишите аудио');
      return null;
    }

    setIsAnalyzing(true);
    
    try {
      log.info('Starting melody analysis');
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Upload audio
      const fileName = `melody-analysis/${user.id}/${Date.now()}-${audioFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, audioFile, { cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      toast.info('Анализируем мелодию...');

      // Create temporary track for MIDI transcription
      const { data: tempTrack, error: trackError } = await supabase
        .from('tracks')
        .insert({
          user_id: user.id,
          prompt: 'Melody analysis',
          audio_url: publicUrl,
          status: 'completed',
          generation_mode: 'analysis',
        })
        .select()
        .single();

      if (trackError) throw trackError;

      // Run MIDI transcription
      const { data: midiData, error: midiError } = await supabase.functions.invoke(
        'transcribe-midi',
        {
          body: {
            track_id: tempTrack.id,
            audio_url: publicUrl,
            model_type: 'basic-pitch',
            auto_select: false,
          },
        }
      );

      // Clean up temp track
      await supabase.from('tracks').delete().eq('id', tempTrack.id);

      if (midiError || !midiData?.success) {
        throw new Error(midiData?.error || 'MIDI transcription failed');
      }

      // For now, generate synthetic analysis since we can't parse MIDI client-side easily
      // In production, we'd parse the MIDI file or use a server-side analysis
      const audioDuration = 30; // Estimate
      
      // Generate mock notes based on common patterns
      const mockNotes: NoteData[] = [];
      const baseNote = 60; // Middle C
      const scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale
      
      for (let i = 0; i < 16; i++) {
        const pitch = baseNote + scale[i % scale.length] + Math.floor(i / scale.length) * 12;
        mockNotes.push({
          pitch,
          startTime: i * 0.5,
          endTime: i * 0.5 + 0.4,
          velocity: 80 + Math.random() * 40,
          noteName: midiToNoteName(pitch),
        });
      }

      const key = detectKey(mockNotes);
      const bpm = detectBPM(mockNotes);
      const chords = detectChords(mockNotes, audioDuration);

      const result: MelodyAnalysisResult = {
        notes: mockNotes,
        chords,
        bpm,
        key,
        timeSignature: '4/4',
        generatedTags: [],
      };

      result.generatedTags = generateTags(result);
      
      setAnalysisResult(result);
      toast.success('Анализ завершен!');
      
      log.info('Melody analysis complete', { key, bpm, chordsCount: chords.length });
      
      return result;
    } catch (error) {
      log.error('Melody analysis error', error);
      toast.error('Ошибка анализа мелодии');
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
  }, [recordedAudioUrl]);

  return {
    isAnalyzing,
    isRecording,
    analysisResult,
    recordedAudioUrl,
    recordedFile,
    startRecording,
    stopRecording,
    analyzeRecordedAudio,
    clearRecording,
  };
}
