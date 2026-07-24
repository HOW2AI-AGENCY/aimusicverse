// Prompt builder + all visual style / palette / theme helpers.
// Extracted from index.ts (behavior preserved verbatim).

export interface ProjectContext {
  genre?: string;
  mood?: string;
  concept?: string;
  title?: string;
  visualAesthetic?: string;
}

export interface BuildPromptInput {
  title?: string;
  style?: string;
  lyrics?: string;
  mood?: string;
  customPrompt?: string;
  projectContext?: ProjectContext;
}

export function buildImagePrompt(input: BuildPromptInput): string {
  const { title, style, lyrics, mood, customPrompt, projectContext = {} } = input;

  if (customPrompt) {
    return `${customPrompt}. 
Design requirements:
- Square format (1:1 aspect ratio), high resolution
- NO text, NO watermarks, NO logos, NO words, NO letters
- Professional digital art suitable for music streaming platforms
- Clean composition with focal point in center`;
  }

  const moodHint = mood || projectContext.mood || extractMoodFromStyle(style) || "energetic and modern";
  const styleHint = style || projectContext.genre || "electronic music";
  const lyricsTheme = lyrics ? extractThemeFromLyrics(lyrics) : "";
  const conceptHint = projectContext.concept ? extractThemeFromLyrics(projectContext.concept) : "";
  const visualAesthetic = projectContext.visualAesthetic;

  const visualThemes = extractVisualThemes(lyrics);
  const visualStyle = getRandomizedVisualStyle(styleHint, moodHint, title || "");
  const colorPalette = getRandomizedColorPalette(moodHint, styleHint, title || "");
  const artStyle = getRandomArtStyle(styleHint);
  const composition = getRandomComposition();

  return `Create a ${artStyle} album cover art for a music streaming platform.

Track: "${title || "Untitled Track"}"
${projectContext.title ? `Album/Project: "${projectContext.title}"` : ""}
Music Genre: ${styleHint}
Mood & Atmosphere: ${moodHint}
${lyricsTheme ? `Lyrical Theme: ${lyricsTheme}` : ""}
${conceptHint ? `Project Concept: ${conceptHint}` : ""}
${visualThemes ? `Visual Imagery from lyrics: ${visualThemes}` : ""}
${
  visualAesthetic
    ? `
IMPORTANT - Artist's Visual Direction: ${visualAesthetic}
Follow the artist's visual direction closely - this is the creative vision for the album artwork.`
    : ""
}

Design requirements:
- Visual Style: ${visualStyle.style}
- ${visualAesthetic ? "Follow the artist visual direction above as primary style guide" : `Color palette: ${colorPalette.colors} with ${colorPalette.technique}`}
- Composition: ${composition}
- Mood expression: ${visualStyle.moodExpression}
- ${visualStyle.uniqueElement}
- NO text, NO watermarks, NO logos, NO words, NO letters
- Square format (1:1 aspect ratio), high resolution
- Professional digital art suitable for streaming platforms
- Make this cover DISTINCTIVE and MEMORABLE

Art direction: ${artStyle}, ${visualStyle.aesthetic}`;
}

// ============= VISUAL STYLE GENERATORS =============

function getRandomizedVisualStyle(
  genre: string,
  mood: string,
  title: string,
): {
  style: string;
  aesthetic: string;
  moodExpression: string;
  uniqueElement: string;
} {
  const genreLower = genre.toLowerCase();
  const moodLower = mood.toLowerCase();
  const hash = simpleHash(title + genre + mood);

  const styleOptions: Record<string, string[][]> = {
    electronic: [
      ["cyberpunk cityscapes with neon rain", "neo-tokyo aesthetic", "futuristic skyline reflections"],
      ["abstract data visualization", "digital particles forming patterns", "glitch art with geometric shapes"],
      ["holographic surfaces", "iridescent liquid metal", "chrome reflections on glass"],
      ["wireframe landscapes", "vector art environments", "low-poly crystal formations"],
    ],
    rock: [
      ["dramatic mountain silhouettes at sunset", "volcanic landscapes with molten lava", "storm clouds over desert"],
      ["vintage amplifier close-up", "abstract guitar strings as light rays", "worn leather texture compositions"],
      ["graffiti-covered urban walls", "industrial rust and decay", "street photography noir"],
      ["flames and smoke formations", "shattered glass effects", "motion blur energy bursts"],
    ],
    pop: [
      ["candy-colored geometric patterns", "balloon clusters in gradient sky", "confetti explosion freeze-frame"],
      ["glossy lips macro detail", "holographic bubbles floating", "rainbow light prism effects"],
      ["retro polaroid collage style", "vaporwave sunset aesthetics", "neon sign reflections in rain"],
      ["crystal formations in pastel colors", "kaleidoscope pattern symmetry", "floating shapes in dreamy space"],
    ],
    hiphop: [
      ["gold chains as abstract art", "boombox transformed into sculpture", "crown imagery reimagined"],
      ["street corner night scene", "basketball court aerial view", "subway car interiors"],
      ["luxury car reflections", "jewelry macro photography style", "diamond textures and facets"],
      ["graffiti wildstyle backgrounds", "brick wall textures with light", "urban rooftop sunset scenes"],
    ],
    ambient: [
      ["foggy forest pathways", "misty mountain valleys", "aurora borealis over still lake"],
      ["underwater coral dreamscapes", "cloud formations at golden hour", "dew drops on spider web"],
      ["zen garden minimalism", "floating islands in clouds", "bioluminescent ocean depths"],
      ["snow-covered landscapes at dusk", "starfield long exposure", "gentle rain on window glass"],
    ],
    jazz: [
      ["smoky jazz club interiors", "saxophone silhouette in spotlight", "vinyl record grooves macro"],
      ["art deco geometric patterns", "New Orleans wrought iron balconies", "moonlit riverboat scenes"],
      ["whiskey glass with ice", "piano keys in dramatic lighting", "vintage microphone details"],
      ["1920s glamour aesthetic", "blue note abstract compositions", "cityscape night reflections"],
    ],
    classical: [
      ["baroque ceiling frescoes", "marble sculpture details", "ornate gold frames and flourishes"],
      ["grand concert hall interiors", "violin scroll close-up", "sheet music as abstract pattern"],
      ["renaissance garden scenes", "cathedral stained glass", "candlelit chamber atmosphere"],
      ["autumn leaves on stone steps", "misty castle silhouettes", "vintage botanical illustrations"],
    ],
    default: [
      ["abstract fluid dynamics", "cosmic nebula formations", "geometric crystal structures"],
      ["nature macro photography style", "architectural minimalism", "light painting effects"],
      ["surrealist floating objects", "double exposure compositions", "particle swarm formations"],
      ["gradient mesh backgrounds", "organic shape compositions", "textured paper collage style"],
    ],
  };

  let genreStyles = styleOptions.default;
  for (const [key, styles] of Object.entries(styleOptions)) {
    if (
      genreLower.includes(key) ||
      (key === "hiphop" && (genreLower.includes("hip-hop") || genreLower.includes("rap")))
    ) {
      genreStyles = styles;
      break;
    }
  }

  const styleGroup = genreStyles[hash % genreStyles.length];
  const selectedStyle = styleGroup[hash % styleGroup.length];

  const aesthetics = [
    "cinematic lighting with deep shadows",
    "dreamlike soft focus atmosphere",
    "high contrast dramatic composition",
    "ethereal glow effects",
    "vintage film grain texture",
    "ultra-modern clean lines",
    "organic flowing forms",
    "sharp geometric precision",
  ];

  const moodExpressions = getMoodExpressions(moodLower, hash);

  const uniqueElements = [
    "Add an unexpected visual twist that creates intrigue",
    "Include subtle symbolic imagery related to the theme",
    "Create depth through layered visual elements",
    "Use negative space strategically for impact",
    "Incorporate reflective or mirrored elements",
    "Add organic textures for tactile quality",
    "Use scale contrast for visual interest",
    "Include motion blur or dynamic movement",
  ];

  return {
    style: selectedStyle,
    aesthetic: aesthetics[hash % aesthetics.length],
    moodExpression: moodExpressions,
    uniqueElement: uniqueElements[(hash + 3) % uniqueElements.length],
  };
}

function getMoodExpressions(mood: string, hash: number): string {
  const expressions: Record<string, string[]> = {
    dark: [
      "deep shadows with subtle light sources piercing through",
      "mysterious silhouettes emerging from darkness",
      "moody atmosphere with hidden details in shadows",
      "noir-inspired high contrast with single color accent",
    ],
    energetic: [
      "explosive energy radiating from center",
      "dynamic motion lines suggesting speed and power",
      "vibrant bursts of color in controlled chaos",
      "action freeze-frame with energy particles",
    ],
    romantic: [
      "soft dreamy focus with warm highlights",
      "delicate petal-like textures and curves",
      "intimate close-up perspective with bokeh",
      "sunset golden hour warmth and tenderness",
    ],
    melancholic: [
      "rain-washed surfaces with reflection puddles",
      "autumn leaves in gentle decay",
      "empty spaces suggesting absence and longing",
      "blue hour twilight with distant lights",
    ],
    aggressive: [
      "sharp angular forms with jagged edges",
      "intense red and black color clash",
      "cracked and fractured surfaces",
      "explosive impact moment frozen in time",
    ],
    peaceful: [
      "zen minimalism with breathing room",
      "gentle water ripples and calm surfaces",
      "soft morning light through mist",
      "balanced composition with natural elements",
    ],
    euphoric: [
      "ascending light beams breaking through",
      "celebration of color and movement",
      "uplifting composition reaching skyward",
      "sparkling highlights and joyful energy",
    ],
    mysterious: [
      "fog-shrouded scenes with hidden depths",
      "partially revealed forms creating curiosity",
      "unusual angles and perspective shifts",
      "symbols and patterns with hidden meaning",
    ],
    default: [
      "balanced composition with clear focal point",
      "harmonious color relationships",
      "dynamic yet controlled visual flow",
      "professional polish with artistic edge",
    ],
  };

  let selectedExpressions = expressions.default;
  for (const [key, exps] of Object.entries(expressions)) {
    if (mood.includes(key)) {
      selectedExpressions = exps;
      break;
    }
  }

  return selectedExpressions[hash % selectedExpressions.length];
}

function getRandomizedColorPalette(
  mood: string,
  genre: string,
  title: string,
): {
  colors: string;
  technique: string;
} {
  const hash = simpleHash(title + mood);
  const moodLower = mood.toLowerCase();
  const genreLower = genre.toLowerCase();

  const palettes: Record<string, string[]> = {
    dark: [
      "deep midnight blue, charcoal black, and electric purple",
      "blood red, onyx black, and gunmetal gray",
      "forest green so dark it seems black, with silver accents",
      "deep burgundy, espresso brown, and antique gold",
      "ink black, royal purple, and crimson highlights",
    ],
    energetic: [
      "electric orange, hot pink, and acid yellow",
      "neon green, electric blue, and white",
      "coral red, sunshine yellow, and turquoise",
      "magenta, cyan, and lime green",
      "fire orange, cherry red, and golden yellow",
    ],
    romantic: [
      "dusty rose, champagne gold, and soft ivory",
      "blush pink, lavender, and pearl white",
      "coral peach, sunset orange, and cream",
      "mauve, rose gold, and soft gray",
      "terracotta, soft pink, and warm sand",
    ],
    chill: [
      "ocean teal, seafoam green, and sandy beige",
      "powder blue, mint green, and cloud white",
      "sage green, warm gray, and oatmeal",
      "periwinkle, soft lavender, and cream",
      "ice blue, silver, and pale mint",
    ],
    nostalgic: [
      "sepia brown, cream, and vintage gold",
      "faded orange, mustard yellow, and olive",
      "dusty pink, muted teal, and aged paper",
      "burnt sienna, harvest gold, and avocado",
      "rust orange, cream, and chocolate brown",
    ],
    futuristic: [
      "chrome silver, electric blue, and hot pink",
      "iridescent violet, holographic silver, and cyan",
      "neon purple, midnight blue, and laser green",
      "titanium gray, plasma blue, and UV purple",
      "mirror chrome, neon orange, and deep space black",
    ],
    earthy: [
      "terracotta, sage green, and warm sand",
      "forest moss, clay brown, and stone gray",
      "burnt umber, olive green, and ochre",
      "redwood, fern green, and river stone",
      "amber, eucalyptus, and raw linen",
    ],
    ethereal: [
      "opalescent white, soft lilac, and pearl",
      "moonlight silver, mist blue, and aurora green",
      "celestial gold, cosmic purple, and starlight",
      "cloud white, sky blue, and sunset pink",
      "translucent pink, iridescent blue, and diamond white",
    ],
    urban: [
      "concrete gray, graffiti green, and warning yellow",
      "asphalt black, neon sign red, and streetlight amber",
      "subway tile white, rust, and tagger blue",
      "brick red, steel blue, and smog gray",
      "taxi yellow, midnight black, and chrome silver",
    ],
    default: [
      "vibrant purple, electric blue, and sunset orange",
      "deep teal, coral, and golden yellow",
      "indigo, magenta, and mint",
      "sapphire blue, emerald green, and ruby red",
      "violet, turquoise, and amber",
    ],
  };

  let selectedPalette = palettes.default;

  if (moodLower.includes("dark") || moodLower.includes("moody") || moodLower.includes("mysterious")) {
    selectedPalette = palettes.dark;
  } else if (moodLower.includes("energetic") || moodLower.includes("aggressive") || moodLower.includes("powerful")) {
    selectedPalette = palettes.energetic;
  } else if (moodLower.includes("romantic") || moodLower.includes("love") || moodLower.includes("soft")) {
    selectedPalette = palettes.romantic;
  } else if (moodLower.includes("chill") || moodLower.includes("relax") || moodLower.includes("calm")) {
    selectedPalette = palettes.chill;
  } else if (moodLower.includes("nostalgic") || moodLower.includes("retro") || moodLower.includes("vintage")) {
    selectedPalette = palettes.nostalgic;
  } else if (moodLower.includes("futuristic") || genreLower.includes("electronic") || genreLower.includes("synth")) {
    selectedPalette = palettes.futuristic;
  } else if (moodLower.includes("natural") || moodLower.includes("organic") || genreLower.includes("folk")) {
    selectedPalette = palettes.earthy;
  } else if (moodLower.includes("ethereal") || moodLower.includes("dream") || genreLower.includes("ambient")) {
    selectedPalette = palettes.ethereal;
  } else if (genreLower.includes("hip") || genreLower.includes("rap") || genreLower.includes("urban")) {
    selectedPalette = palettes.urban;
  }

  const techniques = [
    "smooth gradient transitions",
    "bold color blocking",
    "subtle color overlays",
    "duotone contrast effect",
    "split complementary harmony",
    "analogous color flow",
    "triadic color balance",
    "monochromatic depth variations",
    "vibrant saturation pops on muted base",
    "desaturated tones with single vivid accent",
  ];

  return {
    colors: selectedPalette[hash % selectedPalette.length],
    technique: techniques[(hash + 5) % techniques.length],
  };
}

function getRandomArtStyle(genre: string): string {
  const genreLower = genre.toLowerCase();
  const hash = simpleHash(genre + Date.now().toString().slice(-4));

  const artStyles: Record<string, string[]> = {
    electronic: [
      "digital 3D rendering with ray tracing",
      "generative algorithmic art",
      "glitch art with digital artifacts",
      "cyberpunk illustration",
      "vaporwave aesthetic",
      "abstract data visualization",
    ],
    rock: [
      "gritty photorealistic illustration",
      "heavy metal album art style",
      "punk rock collage aesthetic",
      "dark fantasy painting",
      "industrial photography composite",
      "gothic illustration",
    ],
    pop: [
      "vibrant pop art",
      "kawaii cute illustration",
      "glossy magazine photography style",
      "contemporary fashion art",
      "colorful mixed media collage",
      "modern vector illustration",
    ],
    hiphop: [
      "urban street art style",
      "bold graphic design",
      "luxury lifestyle photography",
      "comic book illustration",
      "graffiti wildstyle inspired",
      "high fashion editorial",
    ],
    jazz: [
      "art deco illustration",
      "vintage photography with film grain",
      "watercolor painting",
      "noir photography style",
      "mid-century modern design",
      "expressionist painting",
    ],
    classical: [
      "renaissance oil painting style",
      "baroque dramatic composition",
      "romantic era landscape painting",
      "classical sculpture photography",
      "neoclassical illustration",
      "fine art photography",
    ],
    ambient: [
      "impressionist painting style",
      "ethereal photography",
      "minimalist abstract art",
      "nature macro photography",
      "dreamscape surrealism",
      "soft watercolor wash",
    ],
    default: [
      "modern digital art",
      "contemporary illustration",
      "abstract expressionism",
      "surrealist composition",
      "mixed media artwork",
      "photorealistic rendering",
    ],
  };

  let styles = artStyles.default;
  for (const [key, s] of Object.entries(artStyles)) {
    if (
      genreLower.includes(key) ||
      (key === "hiphop" && (genreLower.includes("hip-hop") || genreLower.includes("rap")))
    ) {
      styles = s;
      break;
    }
  }

  return styles[hash % styles.length];
}

function getRandomComposition(): string {
  const compositions = [
    "centered focal point with radial symmetry",
    "rule of thirds with diagonal movement",
    "asymmetric balance with negative space",
    "full bleed edge-to-edge composition",
    "frame within frame layered depth",
    "extreme close-up detail crop",
    "bird's eye aerial perspective",
    "worm's eye dramatic low angle",
    "spiral golden ratio arrangement",
    "horizontal bands creating rhythm",
    "vertical columns with depth",
    "overlapping elements creating depth",
    "minimalist single subject focus",
    "maximalist detailed composition",
    "split composition with contrast",
  ];

  return compositions[Math.floor(Math.random() * compositions.length)];
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// ============= EXTRACTION HELPERS =============

function extractMoodFromStyle(style: string | undefined): string {
  if (!style) return "";

  const moodKeywords: Record<string, string> = {
    rock: "powerful and energetic",
    pop: "upbeat and catchy",
    electronic: "futuristic and pulsating",
    jazz: "smooth and sophisticated",
    classical: "elegant and timeless",
    "hip-hop": "bold and rhythmic",
    "r&b": "soulful and romantic",
    metal: "intense and aggressive",
    ambient: "ethereal and atmospheric",
    dance: "energetic and euphoric",
    chill: "relaxed and mellow",
    dark: "mysterious and moody",
    epic: "grand and cinematic",
    lofi: "nostalgic and cozy",
    synthwave: "retro-futuristic and neon",
    trap: "hard-hitting and modern",
    house: "groovy and uplifting",
    techno: "hypnotic and driving",
    indie: "introspective and authentic",
    folk: "warm and organic",
    country: "heartfelt and storytelling",
    reggae: "laid-back and positive",
    funk: "groovy and soulful",
    blues: "emotional and raw",
    punk: "rebellious and raw",
    grunge: "gritty and emotional",
    soul: "deep and emotional",
    gospel: "uplifting and spiritual",
  };

  const styleLower = style.toLowerCase();
  for (const [keyword, mood] of Object.entries(moodKeywords)) {
    if (styleLower.includes(keyword)) {
      return mood;
    }
  }

  return "modern and dynamic";
}

function extractThemeFromLyrics(lyrics: string | undefined): string {
  if (!lyrics || lyrics.length < 20) return "";

  const snippet = lyrics
    .substring(0, 200)
    .replace(/\[.*?\]/g, "")
    .trim();
  if (snippet.length < 10) return "";

  return snippet.substring(0, 100);
}

function extractVisualThemes(lyrics: string | undefined): string {
  if (!lyrics || lyrics.length < 20) return "";

  const visualKeywords: Record<string, string> = {
    звезд: "starry night sky",
    star: "starry night sky",
    stars: "constellation of stars",
    небо: "expansive sky",
    sky: "expansive sky",
    ночь: "night atmosphere",
    night: "night atmosphere",
    midnight: "midnight hour",
    солнц: "bright sunlight",
    sun: "bright sunlight",
    sunrise: "dawn breaking",
    sunset: "golden sunset",
    огонь: "flames and fire",
    fire: "flames and fire",
    flame: "dancing flames",
    burn: "burning embers",
    вод: "water elements",
    water: "water elements",
    ocean: "ocean waves",
    океан: "ocean waves",
    море: "sea horizon",
    sea: "sea horizon",
    wave: "rolling waves",
    город: "urban cityscape",
    city: "urban cityscape",
    street: "city streets",
    дожд: "rain drops",
    rain: "rain drops",
    storm: "stormy weather",
    любов: "romantic hearts",
    love: "romantic hearts",
    сердц: "heart shapes",
    heart: "heart shapes",
    свет: "rays of light",
    light: "rays of light",
    shine: "shining light",
    glow: "ethereal glow",
    тьма: "shadows and darkness",
    dark: "shadows and darkness",
    shadow: "mysterious shadows",
    космос: "cosmic space",
    space: "cosmic space",
    galaxy: "spiral galaxy",
    universe: "vast universe",
    лес: "forest landscape",
    forest: "forest landscape",
    tree: "ancient trees",
    горы: "mountain peaks",
    mountain: "mountain peaks",
    cloud: "floating clouds",
    dream: "dreamlike atmosphere",
    fly: "soaring flight",
    wings: "angelic wings",
    moon: "moonlit night",
    луна: "moonlit night",
    diamond: "sparkling diamonds",
    gold: "golden elements",
    silver: "silver accents",
    crystal: "crystal formations",
    ice: "icy landscapes",
    snow: "snowy scenes",
    flower: "blooming flowers",
    rose: "red roses",
    blood: "crimson blood",
    tear: "falling tears",
    angel: "angelic figures",
    devil: "devilish imagery",
    demon: "demonic presence",
    heaven: "heavenly clouds",
    hell: "infernal flames",
    ghost: "ghostly apparitions",
    mirror: "reflective surfaces",
    glass: "shattered glass",
    smoke: "rising smoke",
    dust: "floating dust particles",
    wind: "wind movement",
    thunder: "lightning and thunder",
    lightning: "electric lightning",
  };

  const lyricsLower = lyrics.toLowerCase();
  const themes: string[] = [];

  for (const [keyword, theme] of Object.entries(visualKeywords)) {
    if (lyricsLower.includes(keyword) && !themes.includes(theme)) {
      themes.push(theme);
      if (themes.length >= 4) break;
    }
  }

  return themes.join(", ");
}
