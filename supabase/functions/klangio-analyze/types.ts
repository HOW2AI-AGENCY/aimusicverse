export interface KlangioRequest {
  audio_url: string;
  mode: "transcription" | "chord-recognition" | "chord-recognition-extended" | "beat-tracking";
  model?:
    | "guitar"
    | "piano"
    | "drums"
    | "vocal"
    | "bass"
    | "universal"
    | "lead"
    | "detect"
    | "multi"
    | "wind"
    | "string"
    | "piano_arrangement";
  // OpenAPI spec JobOutputs enum: mxml, midi, pdf, gp5, json, midi_quant
  outputs?: ("midi" | "mxml" | "gp5" | "pdf" | "midi_quant" | "json")[];
  title?: string;
  vocabulary?: "major-minor" | "full";
  user_id?: string;
  stem_type?: string; // Used for intelligent output selection
}

export interface MidiEvent {
  tick: number;
  type: "on" | "off";
  pitch: number;
  velocity: number;
}
