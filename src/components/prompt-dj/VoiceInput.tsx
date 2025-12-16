import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInput({ onTranscript, disabled, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  useEffect(() => {
    // Check browser support
    const SpeechRecognitionClass = (window as Window & { 
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    }).SpeechRecognition || (window as Window & { 
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    }).webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ru-RU';

    recognition.onstart = () => {
      setIsListening(true);
      setIsProcessing(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast.error('Ошибка распознавания речи');
      }
      setIsListening(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsProcessing(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [onTranscript]);

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    
    if (!recognition) {
      toast.error('Голосовой ввод не поддерживается браузером');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsProcessing(true);
    } else {
      setInterimTranscript('');
      recognition.start();
    }
  }, [isListening]);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant={isListening ? 'destructive' : 'outline'}
        size="icon"
        onClick={toggleListening}
        disabled={disabled || isProcessing}
        className={cn(
          'relative transition-all',
          isListening && 'animate-pulse ring-2 ring-destructive/50'
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {/* Recording indicator */}
      {isListening && (
        <span className="absolute -top-1 -right-1 h-3 w-3">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}

      {/* Interim transcript display */}
      {interimTranscript && (
        <div className="absolute top-full left-0 mt-2 p-2 rounded-lg bg-popover border border-border shadow-lg text-xs max-w-48 z-50">
          <p className="text-muted-foreground italic">{interimTranscript}</p>
        </div>
      )}
    </div>
  );
}
