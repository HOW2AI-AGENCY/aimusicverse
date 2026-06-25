/**
 * Voice Cloning Studio Component
 * Complete UI for 6-step voice cloning workflow
 *
 * Features:
 * - Step-by-step guided interface
 * - Audio upload with segment selection
 * - Phrase recording interface
 * - Progress tracking
 * - Error handling
 * - Voice completion confirmation
 *
 * @see src/hooks/useVoiceCloning for state management
 * @see src/services/voice/VoiceCloneService for API integration
 */

import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { logger } from '@/lib/logger';
import { useVoiceCloning } from '@/hooks/useVoiceCloning';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VoiceCloningStudioProps {
  apiKey: string;
  baseUrl?: string;
  onVoiceCreated?: (voiceId: string) => void;
  onCancel?: () => void;
}

export function VoiceCloningStudio({
  apiKey,
  baseUrl = 'https://api.sunoapi.org',
  onVoiceCreated,
  onCancel
}: VoiceCloningStudioProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const voiceCloning = useVoiceCloning({
    apiKey,
    baseUrl,
    onProgress: (progress) => {
      logger.info('Voice cloning progress', { step: progress.step, percentage: progress.percentage, message: progress.message });
    },
    onComplete: (voiceId) => {
      logger.info('Voice cloning completed', { voiceId });
      onVoiceCreated?.(voiceId);
    },
    onError: (error) => {
      logger.error('Voice cloning error', { error });
    }
  });

  // Initialize wavesurfer when audio file is set
  useEffect(() => {
    if (voiceCloning.audioFile && waveformRef.current) {
      const initWaveform = async () => {
        try {
          if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
          }

          const wavesurfer = WaveSurfer.create({
            container: waveformRef.current!,
            waveColor: '#6366f1',
            progressColor: '#8b5cf6',
            cursorColor: '#a78bfa',
            barWidth: 2,
            barGap: 3,
            height: 100,
            normalize: true,
          });

          // Load audio file
          const audioUrl = URL.createObjectURL(voiceCloning.audioFile as Blob);
          await wavesurfer.load(audioUrl);

          wavesurferRef.current = wavesurfer;

          // Enable segment selection
          (wavesurfer as any).on('region-click', (region: { start: number; end: number }) => {
            const start = region.start;
            const end = region.end;
            voiceCloning.setSegmentTimes(start, end);
          });
        } catch (error) {
          logger.error('Failed to initialize waveform', { error });
        }
      };

      initWaveform();
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [voiceCloning.audioFile, voiceCloning]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await voiceCloning.setAudioFile(file);
  };

  // Handle recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      setMediaRecorder(recorder);
      setRecordedChunks(chunks);
      setRecordingState('recording');
      recorder.start();
    } catch (error) {
      logger.error('Failed to start recording', { error });
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorder) return;

    mediaRecorder.stop();
    setRecordingState('recorded');

    // Create blob and upload
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const recordingUrl = URL.createObjectURL(blob);

    voiceCloning.setRecordingUrl(recordingUrl);
  };

  const resetRecording = () => {
    setRecordingState('idle');
    setRecordedChunks([]);
    if (mediaRecorder) {
      mediaRecorder.stream?.getTracks().forEach(track => track.stop());
    }
  };

  // Get current step content
  const renderStepContent = () => {
    switch (voiceCloning.step) {
      case 'upload':
        return (
          <div className="space-y-6">
            {/* Step 1: Upload Original Voice */}
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="voice-upload"
              />
              <label htmlFor="voice-upload" className="cursor-pointer">
                <div className="text-4xl mb-4">🎤</div>
                <p className="text-lg font-semibold">Upload voice file</p>
                <p className="text-sm text-gray-400 mt-2">
                  Supports MP3, WAV, OGG (max 50MB)
                </p>
              </label>
            </div>

            {/* Waveform Display */}
            {voiceCloning.audioFile && (
              <div className="space-y-4">
                <div ref={waveformRef} className="w-full" />
                <div className="text-sm text-gray-400">
                  Selected segment: {voiceCloning.audioFileInfo?.name}
                  {voiceCloning.segmentTimes && (
                    <span className="ml-4">
                      ({voiceCloning.segmentTimes.startS.toFixed(1)}s - {voiceCloning.segmentTimes.endS.toFixed(1)}s)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {voiceCloning.audioFile && (
              <Button
                onClick={voiceCloning.startValidation}
                disabled={voiceCloning.isValidating}
                className="w-full"
              >
                {voiceCloning.isValidating ? 'Validating...' : 'Start Voice Cloning'}
              </Button>
            )}
          </div>
        );

      case 'validate_phrase':
        return (
          <div className="space-y-6">
            {/* Step 2: Validation Phrase */}
            {voiceCloning.isPhraseLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
                <p>Generating validation phrase...</p>
              </div>
            ) : voiceCloning.validatePhrase ? (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Record this phrase:</h3>
                <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-6 mb-6">
                  <p className="text-center text-xl font-serif italic">
                    "{voiceCloning.validatePhrase}"
                  </p>
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  <p>🎵 Sing this phrase clearly (don't speak)</p>
                  <p>Use natural voice without effects</p>
                </div>
                <Button onClick={voiceCloning.regeneratePhrase} variant="outline">
                  Get Different Phrase
                </Button>
              </Card>
            ) : (
              <Button onClick={voiceCloning.getPhrase} className="w-full">
                Get Validation Phrase
              </Button>
            )}
          </div>
        );

      case 'record_phrase':
        return (
          <div className="space-y-6">
            {/* Step 3: Record Phrase */}
            <div className="text-center">
              <p className="text-lg mb-4">Record the validation phrase</p>

              {recordingState === 'idle' ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="w-32 h-32 rounded-full"
                >
                  <div className="text-4xl">🎙️</div>
                  Record
                </Button>
              ) : recordingState === 'recording' ? (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="w-32 h-32 rounded-full animate-pulse"
                >
                  <div className="text-4xl">⏹️</div>
                  Stop
                </Button>
              ) : (
                <div className="space-y-4">
                  <Button onClick={stopRecording} disabled className="w-full">
                    Use This Recording
                  </Button>
                  <Button onClick={resetRecording} variant="outline" className="w-full">
                    Record Again
                  </Button>
                </div>
              )}
            </div>

            {recordingState === 'recorded' && voiceCloning.recordingUrl && (
              <div className="mt-6">
                <audio src={voiceCloning.recordingUrl} controls className="w-full" />
              </div>
            )}
          </div>
        );

      case 'generate_voice':
      case 'wait_voice_id':
        return (
          <div className="space-y-6">
            {/* Step 4-5: Processing */}
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2">
                {voiceCloning.step === 'generate_voice' ? 'Generating custom voice...' : 'Processing voice...'}
              </h3>
              <p className="text-gray-400">
                This may take 1-3 minutes. Please don't close this page.
              </p>
            </div>
          </div>
        );

      case 'verify_ready':
        return (
          <div className="space-y-6">
            {/* Step 6: Verify Ready */}
            {voiceCloning.isChecking ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
                <p>Verifying voice availability...</p>
              </div>
            ) : voiceCloning.voiceId ? (
              <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-700">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-purple-300">Voice Ready!</h3>
                  <p className="text-gray-300">
                    Your custom voice is now available for use
                  </p>
                  <div className="bg-black/30 rounded-lg p-4 text-left font-mono text-sm">
                    <p>Voice ID: {voiceCloning.voiceId}</p>
                  </div>
                  <Button onClick={() => navigator.clipboard.writeText(voiceCloning.voiceId!)}>
                    Copy Voice ID
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700">
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-300">
                  Voice Cloning Completed Successfully!
                </h3>
                <p className="text-gray-300">
                  Your custom voice ({voiceCloning.voiceId}) is now ready for music generation.
                </p>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Voice Cloning Studio</h2>
          <p className="text-gray-400 mt-1">Create your custom AI voice</p>
        </div>
        <Button onClick={voiceCloning.reset} variant="outline">
          Reset
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {voiceCloning.progress.currentStep} of {voiceCloning.progress.totalSteps}</span>
          <span>{Math.round(voiceCloning.progress.percentage)}%</span>
        </div>
        <Progress value={voiceCloning.progress.percentage} className="h-2" />
        <p className="text-sm text-gray-400">{voiceCloning.progress.message}</p>
      </div>

      {/* Error Display */}
      {voiceCloning.error && (
        <Alert variant="destructive">
          <AlertDescription>{voiceCloning.error.message}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={onCancel}
          variant="outline"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}