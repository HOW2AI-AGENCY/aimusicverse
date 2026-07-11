export type LyricsAction =
  | "generate"
  | "improve"
  | "add_tags"
  | "suggest_structure"
  | "generate_section"
  | "continue_line"
  | "suggest_rhymes"
  | "analyze_lyrics"
  | "optimize_for_suno"
  | "smart_generate"
  | "chat"
  | "context_recommendations"
  | "generate_compound_tags"
  | "analyze_rhythm"
  | "fit_structure"
  | "full_analysis"
  | "deep_analysis"
  | "producer_review"
  | "style_convert"
  | "paraphrase"
  | "hook_generator"
  | "vocal_map"
  | "translate_adapt"
  | "drill_prompt_builder"
  | "epic_prompt_builder"
  | "validate_suno_v5";

export interface LyricsRequest {
  action: LyricsAction;
  theme?: string;
  mood?: string;
  genre?: string;
  language?: string;
  existingLyrics?: string;
  lyrics?: string;
  structure?: string;
  sectionType?: string;
  sectionName?: string;
  sectionContent?: string;
  sectionNotes?: string;
  previousLyrics?: string;
  linesCount?: number;
  currentLyrics?: string;
  word?: string;
  title?: string;
  stylePrompt?: string;
  allSectionNotes?: Array<{ type: string; notes: string; tags?: string[] }>;
  globalTags?: string[];
  context?: any;
  message?: string;
  vocalTags?: string[];
  instrumentTags?: string[];
  dynamicTags?: string[];
  emotionalCues?: string[];
  useAdvancedTags?: boolean;
  targetStyle?: string;
  targetTone?: string;
  targetLanguage?: string;
  preserveSyllables?: boolean;
  variantsCount?: number;
}

interface TagProfile {
  vocal: string[];
  instruments: string[];
  dynamics: string[];
  emotions: string[];
}

export const GENRE_TAG_PROFILES: Record<string, TagProfile> = {
  pop: {
    vocal: ["Female Vocal", "Smooth", "Catchy"],
    instruments: ["Synth", "Electronic Drums", "Piano"],
    dynamics: ["Build", "Drop"],
    emotions: ["Uplifting", "Energetic"],
  },
  rock: {
    vocal: ["Male Vocal", "Powerful", "Raspy"],
    instruments: ["Electric Guitar", "Drums", "Bass"],
    dynamics: ["Crescendo", "Breakdown"],
    emotions: ["Intense", "Raw"],
  },
  "hip-hop": {
    vocal: ["Male Rap", "Flow", "Rhythmic"],
    instruments: ["808 Bass", "Hi-Hats", "Sample"],
    dynamics: ["Drop", "Build"],
    emotions: ["Confident", "Street"],
  },
  electronic: {
    vocal: ["Vocoder", "Processed", "Ethereal"],
    instruments: ["Synth Lead", "Arpeggio", "Pad"],
    dynamics: ["Build", "Drop", "Filter Sweep"],
    emotions: ["Hypnotic", "Futuristic"],
  },
  "r&b": {
    vocal: ["Soulful", "Falsetto", "Smooth"],
    instruments: ["Rhodes", "Smooth Bass", "Strings"],
    dynamics: ["Groove", "Soft Build"],
    emotions: ["Sensual", "Intimate"],
  },
  indie: {
    vocal: ["Airy", "Intimate", "Breathy"],
    instruments: ["Acoustic Guitar", "Indie Drums", "Ambient"],
    dynamics: ["Subtle Build", "Atmospheric"],
    emotions: ["Dreamy", "Nostalgic"],
  },
  folk: {
    vocal: ["Natural", "Storytelling", "Warm"],
    instruments: ["Acoustic Guitar", "Banjo", "Violin"],
    dynamics: ["Organic", "Building"],
    emotions: ["Earthy", "Heartfelt"],
  },
  jazz: {
    vocal: ["Smooth", "Improvised", "Swing"],
    instruments: ["Piano", "Double Bass", "Saxophone"],
    dynamics: ["Swing Feel", "Solo Section"],
    emotions: ["Cool", "Sophisticated"],
  },
  drill: {
    vocal: ["Male Grit Rap", "Aggressive Delivery", "Street Flow"],
    instruments: ["808 Bass", "Rapid Hi-Hats", "Drill Glockenspiel", "Dark Synth"],
    dynamics: ["Drop", "Build", "Heavy Distortion"],
    emotions: ["Menacing", "Street", "Confident"],
  },
  "uk-drill": {
    vocal: ["Male Rap", "UK Flow", "Gritty", "Aggressive"],
    instruments: ["808 Slides", "Trap Snare", "140 BPM", "Dark Piano", "Drill Glockenspiel"],
    dynamics: ["Explosive Drop", "Heavy Distortion", "Build"],
    emotions: ["Dark", "Street", "Aggressive", "Menacing"],
  },
  trap: {
    vocal: ["Autotune Rap", "Melodic Flow", "Ad-libs"],
    instruments: ["808 Bass", "Hi-Hat Rolls", "Synth Lead", "Trap Snare"],
    dynamics: ["Drop", "Build", "Filter Sweep"],
    emotions: ["Flexing", "Confident", "Hypnotic"],
  },
  phonk: {
    vocal: ["Deep Voice", "Chopped Samples", "Memphis Flow"],
    instruments: ["Cowbell", "808 Bass", "Memphis Sample", "Distorted Synth"],
    dynamics: ["Heavy Bass Drop", "Distortion"],
    emotions: ["Dark", "Aggressive", "Underground"],
  },
  cyberpunk: {
    vocal: ["Vocoder", "Distorted", "Robotic", "Ethereal"],
    instruments: ["Dark Synth", "Glitch", "Industrial Bass", "Arpeggio"],
    dynamics: ["Build", "Breakdown", "Filter Sweep", "Explosive"],
    emotions: ["Dystopian", "Futuristic", "Menacing", "Epic"],
  },
  latin: {
    vocal: ["Spanish Flow", "Reggaeton Style", "Melodic"],
    instruments: ["Dembow Beat", "Timbales", "Latin Guitar", "Brass"],
    dynamics: ["Rhythmic", "Dance", "Drop"],
    emotions: ["Passionate", "Sensual", "Energetic"],
  },
  afrobeat: {
    vocal: ["African Flow", "Melodic", "Rhythmic"],
    instruments: ["African Percussion", "Guitar", "Brass", "Talking Drum"],
    dynamics: ["Groove", "Build", "Polyrhythm"],
    emotions: ["Joyful", "Energetic", "Uplifting"],
  },
  metal: {
    vocal: ["Growl", "Scream", "Powerful", "Aggressive"],
    instruments: ["Heavy Guitar", "Double Bass Drums", "Distorted Bass"],
    dynamics: ["Breakdown", "Blast Beat", "Drop"],
    emotions: ["Intense", "Aggressive", "Dark", "Powerful"],
  },
  ambient: {
    vocal: ["Ethereal", "Whisper", "Atmospheric"],
    instruments: ["Pad", "Texture", "Drone", "Field Recording"],
    dynamics: ["Slow Build", "Fade", "Atmospheric"],
    emotions: ["Meditative", "Dreamy", "Peaceful", "Mysterious"],
  },
  house: {
    vocal: ["Soulful", "Diva", "Chopped Vocal"],
    instruments: ["4-on-floor", "Synth Stab", "Piano House", "Clap"],
    dynamics: ["Build", "Drop", "Filter"],
    emotions: ["Euphoric", "Uplifting", "Dance"],
  },
};

export const SUB_GENRE_MODIFIERS: Record<string, string[]> = {
  "russian-flow": ["Russian Rap", "Cyrillic Lyrics", "Eastern Melody"],
  "thai-fusion": ["Thai Gong", "Asian Percussion", "Tropical Synth"],
  "lo-fi": ["Vinyl Crackle", "Warm", "Mellow", "Tape Hiss"],
  epic: ["Orchestral", "Choir", "Massive Build", "Cinematic"],
  dark: ["Minor Key", "Ominous", "Heavy", "Brooding"],
  aggressive: ["Distortion", "Shout", "Intense", "Heavy"],
  melodic: ["Harmonies", "Smooth", "Emotional", "Catchy"],
  vintage: ["Retro", "Analog", "Warm", "Classic"],
};

export const MOOD_TAG_PROFILES: Record<string, Omit<TagProfile, "instruments">> = {
  romantic: {
    dynamics: ["Soft", "Building", "Intimate"],
    emotions: ["Tender", "Passionate", "Longing"],
    vocal: ["Gentle", "Breathy", "Emotional"],
  },
  energetic: {
    dynamics: ["Driving", "Punchy", "High Energy"],
    emotions: ["Exciting", "Powerful", "Anthemic"],
    vocal: ["Strong", "Belting", "Dynamic"],
  },
  melancholic: {
    dynamics: ["Sparse", "Slow Build", "Atmospheric"],
    emotions: ["Sad", "Reflective", "Bittersweet"],
    vocal: ["Vulnerable", "Whispering", "Trembling"],
  },
  happy: {
    dynamics: ["Upbeat", "Bouncy", "Light"],
    emotions: ["Joyful", "Carefree", "Bright"],
    vocal: ["Cheerful", "Playful", "Warm"],
  },
  dark: {
    dynamics: ["Heavy", "Intense", "Brooding"],
    emotions: ["Menacing", "Mysterious", "Ominous"],
    vocal: ["Deep", "Growling", "Whispered"],
  },
  nostalgic: {
    dynamics: ["Warm", "Vintage", "Gradual"],
    emotions: ["Wistful", "Reminiscent", "Bittersweet"],
    vocal: ["Soft", "Reflective", "Sincere"],
  },
  peaceful: {
    dynamics: ["Gentle", "Flowing", "Ambient"],
    emotions: ["Calm", "Serene", "Meditative"],
    vocal: ["Soft", "Airy", "Soothing"],
  },
  epic: {
    dynamics: ["Massive Build", "Orchestral Swell", "Climactic"],
    emotions: ["Triumphant", "Heroic", "Majestic"],
    vocal: ["Powerful", "Choir", "Soaring"],
  },
  aggressive: {
    dynamics: ["Heavy", "Punchy", "Explosive"],
    emotions: ["Angry", "Intense", "Fierce"],
    vocal: ["Shout", "Growl", "Aggressive"],
  },
  hypnotic: {
    dynamics: ["Repetitive", "Pulsing", "Gradual"],
    emotions: ["Trance", "Mysterious", "Captivating"],
    vocal: ["Monotone", "Whisper", "Ethereal"],
  },
};

export const MOOD_PROFILES = MOOD_TAG_PROFILES;
