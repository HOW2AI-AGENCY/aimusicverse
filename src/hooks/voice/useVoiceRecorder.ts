import { useCallback, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "stopped" | "error";

export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      setBlob(null);
      setDuration(0);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 44100, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime });
        setBlob(b);
        setState("stopped");
        stream.getTracks().forEach((t) => t.stop());
        if (tickRef.current) {
          clearInterval(tickRef.current);
          tickRef.current = null;
        }
      };
      mediaRef.current = rec;
      startedAtRef.current = Date.now();
      rec.start(100);
      setState("recording");
      tickRef.current = window.setInterval(() => {
        setDuration((Date.now() - startedAtRef.current) / 1000);
      }, 100);
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setBlob(null);
    setDuration(0);
    setError(null);
    setState("idle");
  }, []);

  return { state, blob, duration, error, start, stop, reset };
}
