/**
 * AI Intent Recognition - Smart message understanding
 * Uses pattern matching and AI for complex intent detection
 */

export interface DetectedIntent {
  type: IntentType;
  confidence: number;
  entities: Record<string, string>;
  suggestedAction?: string;
  suggestedResponse?: string;
}

export type IntentType =
  | "generate_music"
  | "upload_audio"
  | "create_cover"
  | "extend_track"
  | "view_library"
  | "check_status"
  | "get_help"
  | "greeting"
  | "view_profile"
  | "buy_credits"
  | "analyze_audio"
  | "midi_convert"
  | "recognize_song"
  | "unknown";

interface IntentPattern {
  type: IntentType;
  patterns: RegExp[];
  keywords: string[];
  weight: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    type: "generate_music",
    patterns: [
      /созд(ай|ать|авать)/i,
      /сгенер(ируй|ировать)/i,
      /сделай? (музык|трек|песн)/i,
      /хочу (трек|песню|музык)/i,
      /напиш(и|ите) (песню|музык)/i,
      /генер(ируй|ация|ировать)/i,
    ],
    keywords: ["создай", "сгенерируй", "сделай музыку", "хочу трек", "напиши песню", "генерация"],
    weight: 1.0,
  },
  {
    type: "upload_audio",
    patterns: [/загруз(ить|и)/i, /отправ(ить|лю) (файл|аудио)/i, /залить/i, /upload/i],
    keywords: ["загрузить", "залить", "отправить файл", "upload"],
    weight: 0.9,
  },
  {
    type: "create_cover",
    patterns: [/кавер/i, /cover/i, /ремикс/i, /remix/i, /перепе(ть|вать)/i, /переделать/i],
    keywords: ["кавер", "cover", "ремикс", "remix", "перепеть", "переделать"],
    weight: 0.9,
  },
  {
    type: "extend_track",
    patterns: [/продолж(и|ить)/i, /расшир(ь|ить)/i, /extend/i, /продолжение/i, /удлин(ить|и)/i],
    keywords: ["продолжи", "расширь", "extend", "продолжение", "удлинить"],
    weight: 0.9,
  },
  {
    type: "view_library",
    patterns: [/мои (треки|песни|композиции)/i, /библиотек/i, /library/i, /покаж(и|ите) (треки|песни)/i],
    keywords: ["мои треки", "библиотека", "library", "мои песни"],
    weight: 0.8,
  },
  {
    type: "check_status",
    patterns: [/статус/i, /где (мой|трек)/i, /когда (будет|готово)/i, /progress/i, /готов(о|ность)?/i],
    keywords: ["статус", "где мой трек", "когда будет", "готово"],
    weight: 0.8,
  },
  {
    type: "get_help",
    patterns: [
      /помо(щь|гите|жи)/i,
      /help/i,
      /что (умеешь|можешь)/i,
      /команд(ы|а)/i,
      /как (пользоваться|работает)/i,
      /инструкц/i,
    ],
    keywords: ["помощь", "help", "что умеешь", "команды", "как пользоваться"],
    weight: 0.7,
  },
  {
    type: "greeting",
    patterns: [/^привет/i, /^здравствуй/i, /^hello/i, /^hi\b/i, /^хай/i, /^добр(ый|ое|ого)/i],
    keywords: ["привет", "здравствуйте", "hello", "хай", "добрый"],
    weight: 0.6,
  },
  {
    type: "view_profile",
    patterns: [/мой профиль/i, /profile/i, /мо(й|я|и) (баланс|кредит|уровень)/i, /сколько (кредитов|у меня)/i],
    keywords: ["профиль", "баланс", "кредиты", "уровень"],
    weight: 0.7,
  },
  {
    type: "buy_credits",
    patterns: [/купить (кредит|звёзд)/i, /пополн(ить|ение)/i, /оплат(а|ить)/i, /подписк/i],
    keywords: ["купить", "пополнить", "оплата", "подписка"],
    weight: 0.8,
  },
  {
    type: "analyze_audio",
    patterns: [/анализ/i, /проанализир/i, /разбер(и|ите)/i, /bpm/i, /тональность/i, /аккорды/i],
    keywords: ["анализ", "bpm", "тональность", "аккорды"],
    weight: 0.8,
  },
  {
    type: "midi_convert",
    patterns: [/midi/i, /миди/i, /нот(ы|ация)/i, /конверт(ируй|ация)/i, /транскрип/i],
    keywords: ["midi", "миди", "ноты", "конвертация"],
    weight: 0.8,
  },
  {
    type: "recognize_song",
    patterns: [/распозна(й|ть)/i, /что за (песня|трек|музыка)/i, /определ(и|ить) (песню|трек)/i, /shazam/i],
    keywords: ["распознать", "что за песня", "определить", "shazam"],
    weight: 0.8,
  },
];

/**
 * Extract music style from text
 */
function extractMusicStyle(text: string): string | null {
  const stylePatterns = [
    { regex: /рок|rock/i, style: "rock" },
    { regex: /поп|pop/i, style: "pop" },
    { regex: /электро|electronic|edm/i, style: "electronic" },
    { regex: /хип.?хоп|hip.?hop|рэп|rap/i, style: "hiphop" },
    { regex: /джаз|jazz/i, style: "jazz" },
    { regex: /классик|classical/i, style: "classical" },
    { regex: /эмбиент|ambient/i, style: "ambient" },
    { regex: /lo.?fi|лофи/i, style: "lofi" },
    { regex: /металл?|metal/i, style: "metal" },
    { regex: /фолк|folk/i, style: "folk" },
    { regex: /блюз|blues/i, style: "blues" },
    { regex: /регги|reggae/i, style: "reggae" },
  ];

  for (const { regex, style } of stylePatterns) {
    if (regex.test(text)) {
      return style;
    }
  }

  return null;
}

/**
 * Detect intent from user message
 */
export function detectIntent(text: string): DetectedIntent {
  const normalizedText = text.toLowerCase().trim();
  let bestMatch: DetectedIntent = {
    type: "unknown",
    confidence: 0,
    entities: {},
  };

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;

    // Check regex patterns
    for (const regex of pattern.patterns) {
      if (regex.test(normalizedText)) {
        score += 0.4 * pattern.weight;
        break;
      }
    }

    // Check keywords
    for (const keyword of pattern.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        score += 0.3 * pattern.weight;
        break;
      }
    }

    // Boost score for exact keyword match at start
    for (const keyword of pattern.keywords) {
      if (normalizedText.startsWith(keyword.toLowerCase())) {
        score += 0.2 * pattern.weight;
        break;
      }
    }

    if (score > bestMatch.confidence) {
      bestMatch = {
        type: pattern.type,
        confidence: Math.min(score, 1.0),
        entities: {},
      };
    }
  }

  // Extract entities based on intent
  if (bestMatch.type === "generate_music") {
    const style = extractMusicStyle(text);
    if (style) {
      bestMatch.entities.style = style;
    }
    // Check if user wants instrumental
    if (/без вокал|instrumental|инструментал/i.test(text)) {
      bestMatch.entities.instrumental = "true";
    }
  }

  // Generate suggested responses
  bestMatch.suggestedAction = getSuggestedAction(bestMatch.type);
  bestMatch.suggestedResponse = getSuggestedResponse(bestMatch.type, bestMatch.entities);

  return bestMatch;
}

function getSuggestedAction(intentType: IntentType): string {
  const actions: Record<IntentType, string> = {
    generate_music: "nav_generate",
    upload_audio: "start_upload",
    create_cover: "start_cover",
    extend_track: "start_extend",
    view_library: "nav_library",
    check_status: "check_status",
    get_help: "nav_help",
    greeting: "nav_main",
    view_profile: "nav_profile",
    buy_credits: "buy_credits",
    analyze_audio: "nav_analyze",
    midi_convert: "start_midi",
    recognize_song: "start_recognize",
    unknown: "",
  };

  return actions[intentType];
}

function getSuggestedResponse(intentType: IntentType, entities: Record<string, string>): string {
  switch (intentType) {
    case "generate_music":
      const style = entities.style;
      return style
        ? `Отлично! Хотите создать трек в стиле ${style}?`
        : "Хотите создать музыку? Опишите желаемый стиль или используйте /generate";
    case "upload_audio":
      return "Используйте /upload чтобы загрузить аудио в облако";
    case "create_cover":
      return "Используйте /cover и отправьте аудиофайл для создания кавера";
    case "extend_track":
      return "Используйте /extend и отправьте аудиофайл для расширения трека";
    case "view_library":
      return "Используйте /library чтобы посмотреть ваши треки";
    case "check_status":
      return "Используйте /status чтобы проверить статус генерации";
    case "get_help":
      return "Используйте /help для списка всех команд";
    case "greeting":
      return "👋 Привет! Чем могу помочь?";
    case "view_profile":
      return "Используйте /profile чтобы посмотреть профиль и баланс";
    case "buy_credits":
      return "Используйте /buy для покупки кредитов";
    case "analyze_audio":
      return "Используйте /analyze для анализа аудио";
    case "midi_convert":
      return "Используйте /midi для конвертации в MIDI";
    case "recognize_song":
      return "Используйте /recognize и отправьте аудио для распознавания";
    default:
      return "";
  }
}

/**
 * Check if text looks like a music generation prompt
 */
export function isMusicPrompt(text: string): boolean {
  // Check if text contains music-related keywords
  const musicKeywords = [
    /трек/i,
    /песн/i,
    /музык/i,
    /мелоди/i,
    /ритм/i,
    /бит/i,
    /вокал/i,
    /гитар/i,
    /барабан/i,
    /синтезатор/i,
    /пиано/i,
    /rock/i,
    /pop/i,
    /jazz/i,
    /hip.?hop/i,
    /electronic/i,
    /энергичн/i,
    /спокойн/i,
    /веселый|радостн/i,
    /грустн/i,
    /быстр/i,
    /медленн/i,
    /танцевальн/i,
  ];

  for (const keyword of musicKeywords) {
    if (keyword.test(text)) {
      return true;
    }
  }

  return false;
}
