import { type SkipReason } from "../_shared/suno-clip-fields.ts";

export interface TaskRecoveryStats {
  recovered: number;
  checked: number;
  updated: number;
  completed: number;
  failed: number;
  stemChecked: number;
  stemCompleted: number;
  stemFailed: number;
  expired: unknown;
}

export interface RecoveryTask {
  id: string;
  user_id: string;
  track_id: string;
  status: string;
  generation_mode: string;
  suno_task_id: string;
  audio_clips: string | any[];
  tracks?: {
    id: string;
    status: string;
    audio_url?: string;
    active_version_id?: string;
    title?: string;
    tags?: string[];
  };
}

export interface StaleTask extends RecoveryTask {
  created_at: string;
}

export interface StemTask {
  id: string;
  track_id: string;
  separation_task_id: string;
  mode?: string;
  status: string;
  created_at: string;
  tracks?: {
    id: string;
    user_id: string;
  };
}

export interface Clip {
  id: string;
  title?: string;
  tags?: string[];
  duration?: number;
  url?: string;
  stream_url?: string;
  cover_url?: string;
  lyrics?: string;
  model_name?: string;
}

export interface TrackVersion {
  id: string;
  track_id: string;
  audio_url: string;
  cover_url: string;
  duration_seconds: number;
  version_type: string;
  version_label: string;
  clip_index: number;
  is_primary: boolean;
  metadata: {
    suno_id: string;
    title?: string;
    tags?: string[];
    lyrics?: string;
    model_name?: string;
    recovered?: boolean;
    suno_task_id?: string;
    replace_section?: boolean;
    original_task_id?: string;
    source_audio_url?: string;
    stream_audio_url?: string;
    synced_by?: string;
  };
}

export interface SkipReason {
  code: string;
  message: string;
  availableKeys: string[];
}
