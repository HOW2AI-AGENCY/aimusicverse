export interface AudioClipData {
  audioUrl: string;
  title: string;
  duration?: number;
  versionLabel: string;
  lyricsPreview?: string;
  coverUrl?: string;
}

export interface NotificationPayload {
  task_id?: string;
  chat_id?: number;
  chatId?: number;
  user_id?: string;
  status?: string;
  track_id?: string;
  trackId?: string;
  type?: string;
  error_message?: string;
  audioUrl?: string;
  coverUrl?: string;
  videoUrl?: string;
  title?: string;
  duration?: number;
  tags?: string;
  style?: string;
  versionsCount?: number;
  versionLabel?: string;
  currentVersion?: number;
  totalVersions?: number;
  generationMode?: string;
  audioClips?: AudioClipData[];
  message?: string;
  progress?: number;
  messageId?: number; // For editing/deleting progress messages
  // Stems complete notification fields
  trackTitle?: string;
  stems?: Array<{ type: string; label: string; audioUrl: string }>;
  stemsCount?: number;
}

export interface NotificationSettings {
  notify_completed: boolean;
  notify_failed: boolean;
  notify_progress: boolean;
  notify_stem_ready: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}
