/**
 * Cloud Audio Service
 *
 * Wraps `listReferenceAudioForUser` from `@/api/recordings.api`. Used by
 * the CloudAudioPicker to display the user's reference audio library.
 */

import { listReferenceAudioForUser, type CloudAudioRow } from "@/api/recordings.api";

export type CloudAudio = CloudAudioRow;

export async function listCloudAudio(userId: string, limit = 50): Promise<CloudAudio[]> {
  return listReferenceAudioForUser(userId, limit);
}
