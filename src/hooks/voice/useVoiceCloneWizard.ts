import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { voiceCloneApi, type CustomVoice } from '@/api/voice-clone.api';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export type WizardStep =
  | 'upload'        // pick file + segment
  | 'validating'    // waiting for phrase
  | 'phrase_ready'  // show phrase, record
  | 'generating'    // waiting for voiceId
  | 'ready'         // done
  | 'failed';

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 5 * 60 * 1000;

export function useVoiceCloneWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>('upload');
  const [voice, setVoice] = useState<CustomVoice | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startValidation = useCallback(async (params: {
    voiceName: string; sourceFile: Blob; vocalStartS: number; vocalEndS: number;
    language?: string; description?: string; style?: string;
  }) => {
    if (!user?.id) throw new Error('Not authenticated');
    setIsWorking(true);
    try {
      const ext = (params.sourceFile as any).type?.includes('wav') ? 'wav' : 'mp3';
      const sourcePath = await voiceCloneApi.uploadSource(user.id, params.sourceFile, ext);
      const res = await voiceCloneApi.validate({
        voiceName: params.voiceName,
        sourcePath,
        vocalStartS: params.vocalStartS,
        vocalEndS: params.vocalEndS,
        language: params.language,
        description: params.description,
        style: params.style,
      });
      setVoice(res.voice);
      setStep('validating');
      pollValidate(res.taskId, res.voice.id);
    } catch (e) {
      logger.error('Voice validate failed', e as Error);
      toast.error((e as Error).message);
      setStep('failed');
    } finally {
      setIsWorking(false);
    }
  }, [user?.id]);

  const pollValidate = useCallback((taskId: string, _rowId: string) => {
    stopPolling();
    const startedAt = Date.now();
    pollRef.current = window.setInterval(async () => {
      try {
        if (Date.now() - startedAt > POLL_TIMEOUT) {
          stopPolling(); setStep('failed'); toast.error('Timeout waiting for phrase'); return;
        }
        const r = await voiceCloneApi.validateInfo(taskId);
        if (r.status === 'phrase_ready' && r.validateInfo) {
          stopPolling();
          setVoice((v) => v ? { ...v, validate_phrase: r.validateInfo!, status: 'phrase_ready' } : v);
          setStep('phrase_ready');
        } else if (r.status === 'failed') {
          stopPolling(); setStep('failed'); toast.error('Validation failed');
        }
      } catch (e) {
        logger.warn('validate-info poll error', { e });
      }
    }, POLL_INTERVAL);
  }, [stopPolling]);

  const submitRecording = useCallback(async (audio: Blob) => {
    if (!user?.id || !voice) return;
    setIsWorking(true);
    try {
      const verifyPath = await voiceCloneApi.uploadVerification(user.id, audio, 'webm');
      const res = await voiceCloneApi.generate(voice.id, verifyPath);
      setStep('generating');
      pollGenerate(res.taskId);
    } catch (e) {
      logger.error('Voice generate failed', e as Error);
      toast.error((e as Error).message);
      setStep('failed');
    } finally {
      setIsWorking(false);
    }
  }, [user?.id, voice]);

  const pollGenerate = useCallback((taskId: string) => {
    stopPolling();
    const startedAt = Date.now();
    pollRef.current = window.setInterval(async () => {
      try {
        if (Date.now() - startedAt > POLL_TIMEOUT) {
          stopPolling(); setStep('failed'); toast.error('Timeout generating voice'); return;
        }
        const r = await voiceCloneApi.recordInfo(taskId);
        if (r.status === 'ready' && r.voiceId) {
          stopPolling();
          if (voice) {
            try { await voiceCloneApi.checkVoice(r.voiceId); } catch { /* non-fatal */ }
          }
          setVoice((v) => v ? { ...v, voice_id: r.voiceId!, status: 'ready', is_available: true } : v);
          setStep('ready');
          toast.success('Voice ready!');
        } else if (r.status === 'failed') {
          stopPolling(); setStep('failed'); toast.error('Voice generation failed');
        }
      } catch (e) {
        logger.warn('record-info poll error', { e });
      }
    }, POLL_INTERVAL);
  }, [stopPolling, voice]);

  const reRecord = useCallback(async (audio: Blob) => {
    if (!user?.id || !voice) return;
    setIsWorking(true);
    try {
      const verifyPath = await voiceCloneApi.uploadVerification(user.id, audio, 'webm');
      const res = await voiceCloneApi.regenerate(voice.id, verifyPath);
      setStep('generating');
      pollGenerate(res.taskId);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setIsWorking(false); }
  }, [user?.id, voice, pollGenerate]);

  const reset = useCallback(() => {
    stopPolling();
    setVoice(null);
    setStep('upload');
  }, [stopPolling]);

  return { step, voice, isWorking, startValidation, submitRecording, reRecord, reset };
}
