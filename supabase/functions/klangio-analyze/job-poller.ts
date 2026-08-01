import { createLogger } from "../_shared/logger.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const logger = createLogger("klangio-analyze:poller");

/** Poll Klangio job status until completion or timeout. */
export async function pollJobStatus(
  apiKey: string,
  jobId: string,
  mode: string,
  logId: string | null,
  supabase: SupabaseClient,
  startTime: number,
): Promise<any> {
  const maxAttempts = mode === "transcription" ? 90 : 60;
  const pollInterval = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    const resp = await fetch(`https://api.klang.io/job/${jobId}/status`, {
      headers: { "kl-api-key": apiKey },
    });

    if (!resp.ok) {
      logger.warn(`Status check failed: ${resp.status}`);
      continue;
    }

    const data = await resp.json();
    logger.info(`Job status (${attempt + 1}/${maxAttempts}): ${data.status}`);

    if (data.status === "COMPLETED") {
      if (logId) {
        await supabase
          .from("klangio_analysis_logs")
          .update({
            job_id: jobId,
            status: "processing",
            raw_response: data,
          })
          .eq("id", logId);
      }
      return data;
    } else if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(data.status)) {
      const errorMsg = data.error || "Unknown error";
      if (logId) {
        await supabase
          .from("klangio_analysis_logs")
          .update({
            status: "failed",
            error_message: errorMsg,
            duration_ms: Date.now() - startTime,
            completed_at: new Date().toISOString(),
          })
          .eq("id", logId);
      }
      throw new Error(`Klangio job ${data.status}: ${errorMsg}`);
    }
  }

  if (logId) {
    await supabase
      .from("klangio_analysis_logs")
      .update({
        status: "failed",
        error_message: "Job timed out",
        duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString(),
      })
      .eq("id", logId);
  }
  throw new Error("Job timed out waiting for completion");
}

/** Extract generated formats from API response. */
export function getGeneratedFormats(jobResponse: any): string[] {
  const formats: string[] = [];
  if (jobResponse.gen_midi) formats.push("midi");
  if (jobResponse.gen_midi_quant || jobResponse.gen_midi_unq) formats.push("midi_quant");
  if (jobResponse.gen_xml) formats.push("mxml");
  if (jobResponse.gen_gp5) formats.push("gp5");
  if (jobResponse.gen_pdf) formats.push("pdf");
  return formats.length > 0 ? formats : ["midi"];
}
