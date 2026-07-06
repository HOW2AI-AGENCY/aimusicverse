/**
 * Artist name filtering for Suno API compliance
 * Extracted from errorHandling.ts — Sprint 051 T056 decomposition
 */

/**
 * Common artist names that Suno API blocks
 * IMPORTANT: Only include names that are ACTUAL artists
 * Do NOT include common Russian words/names that cause false positives:
 * - "magazin", "lenka", "karina", "chika", "poli", "девочка", "миша", "аня", "класс", "максим"
 */
const BLOCKED_ARTIST_PATTERNS = [
  // English artists - ONLY well-known artists, no common words
  /\b(taylor swift|ed sheeran|beyonce|eminem|kanye west|ariana grande|billie eilish|rihanna|justin bieber|lady gaga|katy perry|bruno mars|post malone|dua lipa|the weeknd|adele|coldplay|maroon 5|imagine dragons|bts|blackpink|twice|red velvet|akon|shakira|pitbull|nicki minaj|cardi b|travis scott|kendrick lamar|j cole|lil wayne|metro boomin|bad bunny|ozuna|daddy yankee|maluma|j balvin|rosalia|doja cat|megan thee stallion|lizzo|harry styles|olivia rodrigo|demi lovato|selena gomez|miley cyrus|nick jonas|shawn mendes|camila cabello|charlie puth|one direction|twenty one pilots|panic at the disco|fall out boy|my chemical romance|green day|blink 182|linkin park|nirvana|pink floyd|led zeppelin|metallica|guns n roses|bon jovi|aerosmith)\b/i,
  // Russian artists - only real confirmed blocked artists, NO common words
  /\b(моргенштерн|morgenshtern|тимати|timati|баста|oxxxymiron|оксимирон|егор крид|егоркрид|egor creed|скриптонит|scriptonite|pharaoh|фараон|miyagi|мияги|jah khalib|джах халиб|matrang|макс корж|max korzh|noize mc|нойз мс|ленинград|leningrad|земфира|zemfira|алла пугачёва|alla pugacheva|филипп киркоров|kirkorov|дима билан|dima bilan|полина гагарина|polina gagarina|григорий лепс|валерий меладзе|meladze|лобода|loboda|монеточка|monetochka|slava marlow|слава марлоу|big baby tape|биг бейби тейп|gone fludd|boulevarddepo|бульвар депо|kizaru|кизару|instasamka|инстасамка|porshi|порши|ruka|рука|stiv|стив|mili|мили)\b/i,
  // K-Pop artists - only group names that are distinctive
  /\b(g-idle|aespa|newjeans|stray kids|le sserafim|nmixx|enhypen|shinee|super junior|girls generation|snsd|2ne1|bigbang)\b/i,
  // African and EDM artists - only distinctive names
  /\b(wizkid|davido|burna boy|asake|ckay|fireboy dml|ayra starr|joeboy|omah lay|skrillex|deadmau5|marshmello|daft punk|david guetta|calvin harris|tiesto|avicii|martin garrix|kygo|alan walker|zedd|steve aoki|diplo|major lazer|afrojack|hardwell|armin van buuren|karol g|becky g|rauw alejandro|jhay cortez)\b/i,
  // Rock/Metal bands that are commonly blocked
  /\b(bad omens|bring me the horizon|bmth|slipknot|korn|system of a down|soad|rammstein|tool|deftones|a7x|avenged sevenfold|three days grace|breaking benjamin|disturbed|godsmack|five finger death punch|ffdp)\b/i,
];

/**
 * Words to EXCLUDE from artist detection (common Russian words/names)
 * These cause false positives because they match artist regex but are regular words
 */
const FALSE_POSITIVE_WORDS = [
  // Common Russian words that cause most false positives (from error logs)
  "magazin",
  "магазин",
  "магазина",
  "магазине",
  "магазину",
  "магазины",
  "магазинов",
  "lenka",
  "ленка",
  "ленке",
  "ленку",
  "ленки",
  "лена",
  "лене",
  "лену",
  "лены",
  "karina",
  "карина",
  "карине",
  "карину",
  "карины",
  "каринка",
  "каринке",
  "chika",
  "девочка",
  "девочки",
  "девочке",
  "девочку",
  "девчонка",
  "девчонки",
  "poli",
  "поли",
  "polina",
  "полина",
  "полине",
  "полину",
  "полины",
  // Common Russian names (extended)
  "миша",
  "мише",
  "мишу",
  "миши",
  "misha",
  "мишка",
  "мишке",
  "михаил",
  "михаила",
  "аня",
  "ане",
  "аню",
  "ани",
  "ania",
  "anna",
  "анна",
  "анне",
  "анну",
  "катя",
  "кате",
  "катю",
  "кати",
  "katya",
  "катька",
  "екатерина",
  "даша",
  "даше",
  "дашу",
  "даши",
  "dasha",
  "дарья",
  "дарье",
  "саша",
  "саше",
  "сашу",
  "саши",
  "sasha",
  "александр",
  "александра",
  "максим",
  "максима",
  "максиму",
  "максиме",
  "maksim",
  "макс",
  "максу",
  "никита",
  "никите",
  "никиту",
  "никиты",
  "nikita",
  "андрей",
  "андрею",
  "андрея",
  "andrey",
  "алексей",
  "алексею",
  "алексея",
  "aleksey",
  "лёша",
  "лёше",
  "дима",
  "диме",
  "диму",
  "димы",
  "dima",
  "дмитрий",
  "ваня",
  "ване",
  "ваню",
  "вани",
  "vanya",
  "иван",
  "ивану",
  "настя",
  "насте",
  "настю",
  "насти",
  "nastya",
  "анастасия",
  "оля",
  "оле",
  "олю",
  "оли",
  "olya",
  "ольга",
  "ольге",
  "юля",
  "юле",
  "юлю",
  "юли",
  "julia",
  "юлия",
  "юлии",
  "маша",
  "маше",
  "машу",
  "маши",
  "masha",
  "мария",
  "марии",
  "вика",
  "вике",
  "вику",
  "вики",
  "vika",
  "виктория",
  "лиза",
  "лизе",
  "лизу",
  "лизы",
  "liza",
  "елизавета",
  "таня",
  "тане",
  "таню",
  "тани",
  "tanya",
  "татьяна",
  // Common Russian words
  "класс",
  "классе",
  "классу",
  "класса",
  "klass",
  "классный",
  "классно",
  "queen",
  "королева",
  "королеве",
  "королеву",
  "drake",
  "дракон",
  "драконе",
  "future",
  "будущее",
  "будущего",
  "teni",
  "тени",
  "тень",
  "теней",
  "mejja",
  "ive",
  "seventeen",
  "семнадцать",
  "exo",
  "nct",
  "txt",
  "psy",
  "itzy",
  "gidle",
  "lany",
  "mirami",
  "мирами",
  "rema",
  "mora",
  "feid",
  "anuel",
  "tena",
  "хаски",
  "husky",
  "nervy",
  "нервы",
  "нерв",
  "mot",
  "мот",
  "мотор",
  "face",
  "фэйс",
  "фейс",
  "лицо",
  "элджей",
  "yelzey",
  "mayot",
  "clipz",
  "платина",
  "platina",
  "thomas mraz",
  "томас мраз",
  "сектор газа",
  "sektor gaza",
  // Extended from recent error logs
  "марина",
  "марине",
  "марину",
  "марины",
  "marina",
  "света",
  "свете",
  "свету",
  "светы",
  "svetlana",
  "светлана",
  "natasha",
  "наташа",
  "наташе",
  "наташу",
  "паша",
  "паше",
  "пашу",
  "pasha",
  "серёжа",
  "сереже",
  "серёжу",
  "sergey",
  "сергей",
  "костя",
  "косте",
  "костю",
  "kostya",
  "константин",
  "петя",
  "пете",
  "петю",
  "petya",
  "пётр",
  "gena",
  "гена",
  "гене",
  "гену",
  "геннадий",
  // Phase 1.2: Extended false positives for commonly misdetected words
  "ruka",
  "рука",
  "руке",
  "руку",
  "руки",
  "рукой",
  "руками",
  "stiv",
  "стив",
  "стиве",
  "стиву",
  "steve",
  "mili",
  "мили",
  "милый",
  "милая",
  "милые",
  "миля",
  "милях",
  "omens",
  "знамения",
  "предзнаменования",
];

/**
 * Check if prompt contains blocked artist names
 * Returns the matched artist name or null
 * Now with false positive filtering
 */
export function checkForBlockedArtists(text: string): string | null {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  // Check if text contains context indicating artist reference
  const artistContextPatterns = [
    /в стиле\s+/i,
    /как у\s+/i,
    /похоже на\s+/i,
    /типа\s+/i,
    /like\s+/i,
    /similar to\s+/i,
    /style of\s+/i,
    /звучит как\s+/i,
    /голосом\s+/i,
  ];

  const hasArtistContext = artistContextPatterns.some((p) => p.test(lowerText));

  for (const pattern of BLOCKED_ARTIST_PATTERNS) {
    const match = lowerText.match(pattern);
    if (match) {
      const matchedWord = match[0].toLowerCase();

      // Skip if it's a known false positive word and no artist context
      if (
        !hasArtistContext &&
        FALSE_POSITIVE_WORDS.some((fp) => matchedWord === fp.toLowerCase() || matchedWord.includes(fp.toLowerCase()))
      ) {
        continue;
      }

      return match[0];
    }
  }

  return null;
}

/**
 * Validate prompt before generation
 * Returns error message or null if valid
 */
export function validatePromptForGeneration(
  prompt: string,
  style?: string,
): {
  valid: boolean;
  error?: string;
  suggestion?: string;
} {
  const textToCheck = `${prompt} ${style || ""}`;

  const blockedArtist = checkForBlockedArtists(textToCheck);
  if (blockedArtist) {
    return {
      valid: false,
      error: `Нельзя использовать имя "${blockedArtist}"`,
      suggestion: "Опишите желаемый стиль без упоминания конкретных артистов",
    };
  }

  return { valid: true };
}
