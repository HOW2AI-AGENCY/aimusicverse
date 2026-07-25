// Intelligent model selection based on stem type
export function getSmartModel(stemType: string | undefined, requestedModel: string | undefined): string {
  // If model explicitly provided, use it
  if (requestedModel && requestedModel !== "universal") {
    return requestedModel;
  }

  const type = (stemType || "").toLowerCase();

  if (type.includes("guitar")) return "guitar";
  if (type.includes("bass")) return "bass";
  if (type.includes("drum")) return "drums";
  if (type.includes("piano") || type.includes("keys")) return "piano";
  if (type.includes("vocal")) return "vocal";
  if (type.includes("lead")) return "lead";
  if (type.includes("string")) return "string";
  if (type.includes("wind")) return "wind";

  // For unknown/other/instrumental - use 'piano' model which has better MIDI support
  // 'universal' model often doesn't generate MIDI for complex polyphonic content
  if (type.includes("instrumental") || type.includes("other") || !type) {
    console.log(`[klangio] stem_type="${stemType}" - using 'piano' model for better MIDI support`);
    return "piano";
  }

  return requestedModel || "piano";
}

// Intelligent output selection based on stem type
export function getSmartOutputs(stemType: string | undefined, requestedOutputs: string[] | undefined): string[] {
  // If outputs explicitly provided, use them
  if (requestedOutputs && requestedOutputs.length > 0) {
    return requestedOutputs;
  }

  // Intelligent selection based on stem type
  const type = (stemType || "").toLowerCase();

  if (type.includes("guitar")) {
    return ["midi", "midi_quant", "gp5", "pdf", "mxml"];
  }
  if (type.includes("bass")) {
    return ["midi", "midi_quant", "gp5", "mxml"];
  }
  if (type.includes("drum")) {
    return ["midi", "midi_quant", "pdf"];
  }
  if (type.includes("piano") || type.includes("keys")) {
    return ["midi", "midi_quant", "pdf", "mxml"];
  }
  if (type.includes("vocal")) {
    return ["midi", "pdf", "mxml"];
  }
  if (type.includes("instrumental") || type.includes("other")) {
    return ["midi", "midi_quant", "mxml"];
  }

  // Default outputs
  return ["midi", "midi_quant", "mxml", "gp5", "pdf"];
}

export function getContentType(format: string): string {
  switch (format) {
    case "midi":
    case "midi_quant":
      return "audio/midi";
    case "mxml":
      return "application/vnd.recordare.musicxml+xml";
    case "gp5":
      return "application/x-guitar-pro";
    case "pdf":
      return "application/pdf";
    case "json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}
