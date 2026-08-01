import type { KlangioRequest } from "./types.ts";

export const API_BASE = "https://api.klang.io";

export interface BuiltRequest {
  endpoint: string;
  formData: FormData;
  generatedFormatsHint: string[];
}

/** Build Klangio endpoint + multipart form based on mode. */
export function buildRequest(
  req: KlangioRequest,
  smartModel: string,
  smartOutputs: string[],
): BuiltRequest | { error: string } {
  const formData = new FormData();
  const queryParams = new URLSearchParams();
  let baseEndpoint: string;
  const generatedFormatsHint: string[] = [];

  switch (req.mode) {
    case "transcription": {
      baseEndpoint = `${API_BASE}/transcription`;
      queryParams.set("model", smartModel);
      queryParams.set("demo", "false");
      formData.append("demo", "false");
      if (req.title) queryParams.set("title", req.title);

      const validFormats = ["midi", "midi_quant", "mxml", "gp5", "pdf"];
      const reqOutputs = req.outputs || smartOutputs;
      const validOutputs = reqOutputs.filter((o: string) => validFormats.includes(o));
      if (validOutputs.length === 0) validOutputs.push("midi");

      // Send outputs as REPEATED form fields (FastAPI/Pydantic List[str])
      validOutputs.forEach((o) => formData.append("outputs", o));

      if (validOutputs.includes("midi")) queryParams.set("gen_midi", "true");
      if (validOutputs.includes("midi_quant")) queryParams.set("gen_midi_quant", "true");
      if (validOutputs.includes("mxml")) queryParams.set("gen_xml", "true");
      if (validOutputs.includes("gp5")) queryParams.set("gen_gp5", "true");
      if (validOutputs.includes("pdf")) queryParams.set("gen_pdf", "true");

      validOutputs.forEach((f) => generatedFormatsHint.push(f));
      break;
    }
    case "chord-recognition":
      baseEndpoint = `${API_BASE}/chord-recognition`;
      queryParams.set("vocabulary", req.vocabulary || "major-minor");
      break;
    case "chord-recognition-extended":
      baseEndpoint = `${API_BASE}/chord-recognition-extended`;
      queryParams.set("vocabulary", req.vocabulary || "full");
      break;
    case "beat-tracking":
      baseEndpoint = `${API_BASE}/beat-tracking`;
      break;
    default:
      return { error: `Unknown mode: ${req.mode}` };
  }

  const endpoint = queryParams.toString() ? `${baseEndpoint}?${queryParams.toString()}` : baseEndpoint;
  return { endpoint, formData, generatedFormatsHint };
}

/** Download audio and attach to form data. */
export async function attachAudio(
  formData: FormData,
  audioUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resp = await fetch(audioUrl);
  if (!resp.ok) return { ok: false, error: `Failed to download audio: ${resp.status}` };
  const blob = await resp.blob();
  formData.append("file", blob, "audio.wav");
  return { ok: true };
}
