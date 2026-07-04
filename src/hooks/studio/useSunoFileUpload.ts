/**
 * useSunoFileUpload — mutation hook for forwarding a base64 audio payload to
 * the suno-file-upload edge function proxy (Sprint 052-B3).
 *
 * Returns a Suno-hosted `file_url` that can be sent as `uploadUrl` to
 * /api/v1/generate/upload-{cover,extend}. The file is auto-deleted by Suno
 * after ~3 days (see expires_in_days), which is fine for the typical
 * generate-then-discard flow.
 *
 * Most callers should NOT use this hook directly — suno-upload-cover and
 * suno-upload-extend already forward audio internally. Use this only when
 * building a flow that needs an uploadUrl from a non-cover/extend context
 * (e.g. drag-and-drop into the studio before deciding the operation).
 */

import { useMutation } from "@tanstack/react-query";
import { sunoFileUpload, type SunoFileUploadParams, type SunoFileUploadResult } from "@/services/studio.service";

export type SunoFileUploadInput = SunoFileUploadParams;

export function useSunoFileUpload() {
  return useMutation<SunoFileUploadResult, Error, SunoFileUploadInput>({
    mutationFn: async (input) => {
      const { data, error } = await sunoFileUpload(input);
      if (error) throw error;
      if (!data) throw new Error("File upload returned no data");
      return data;
    },
  });
}
