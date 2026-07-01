/**
 * Константы и справочные данные для PromptDJ.
 *
 * Извлечено из src/hooks/usePromptDJEnhanced.ts в Sprint 042
 * (god-hook декомпозиция 1071 → ... LOC).
 *
 * Содержит:
 * - CHANNEL_TYPES — каталог каналов и пресетов (genre/instrument/mood/etc.)
 * - NOTE_NAMES — справочник нот
 */

/**
 * Доступные каналы, которые пользователь может выбирать в PromptDJ.
 * Каждый канал имеет тип, метку, цвет и массив пресетов-подсказок.
 */
export const CHANNEL_TYPES = [
  {
    type: "genre",
    label: "Жанр",
    color: "#a855f7",
    presets: [
      "Electronic",
      "Hip-Hop",
      "Rock",
      "Jazz",
      "Pop",
      "Ambient",
      "Lo-Fi",
      "EDM",
      "Classical",
      "Trap",
      "R&B",
      "House",
    ],
  },
  {
    type: "instrument",
    label: "Инструмент",
    color: "#3b82f6",
    presets: [
      "Piano",
      "Guitar",
      "Synth",
      "Strings",
      "Bass",
      "Drums",
      "Pads",
      "Brass",
      "Bells",
      "Choir",
      "Violin",
      "Sax",
    ],
  },
  {
    type: "mood",
    label: "Настроение",
    color: "#ec4899",
    presets: [
      "Energetic",
      "Calm",
      "Dark",
      "Happy",
      "Epic",
      "Dreamy",
      "Aggressive",
      "Romantic",
      "Mysterious",
      "Groovy",
      "Sad",
      "Uplifting",
    ],
  },
  {
    type: "energy",
    label: "Энергия",
    color: "#ef4444",
    presets: [
      "Low",
      "Medium",
      "High",
      "Building",
      "Dropping",
      "Intense",
      "Relaxed",
      "Driving",
      "Floating",
      "Explosive",
    ],
  },
  {
    type: "texture",
    label: "Текстура",
    color: "#f59e0b",
    presets: ["Smooth", "Gritty", "Airy", "Dense", "Sparse", "Layered", "Vintage", "Modern", "Organic", "Digital"],
  },
  {
    type: "style",
    label: "Стиль",
    color: "#22c55e",
    presets: ["Minimalist", "Maximalist", "Retro", "Futuristic", "Cinematic", "Experimental", "Acoustic", "Synthwave"],
  },
  {
    type: "vocal",
    label: "Вокал",
    color: "#06b6d4",
    presets: ["Male", "Female", "Choir", "Whisper", "Powerful", "Soft", "Rap", "Falsetto", "No vocals"],
  },
  {
    type: "tempo",
    label: "Темп",
    color: "#8b5cf6",
    presets: ["Slow", "Medium", "Fast", "Accelerating", "Decelerating", "Steady", "Varying", "Groove"],
  },
  {
    type: "custom",
    label: "Своё",
    color: "#64748b",
    presets: [],
  },
] as const;

/** Имена нот в октаве (используется для генерации секвенций). */
export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
