/**
 * Artist to genre/style replacement suggestions
 * Used for real-time prompt validation and auto-suggestions
 */

export interface ArtistReplacement {
  pattern: RegExp;
  artist: string;
  suggestion: string;
  genre: string;
}

/**
 * Popular artists with their style/genre replacements
 */
export const ARTIST_REPLACEMENTS: ArtistReplacement[] = [
  // Russian Hip-Hop
  { pattern: /\bморгенштерн(а)?\b/i, artist: 'Моргенштерн', suggestion: 'aggressive trap, autotune vocals, club-ready beats', genre: 'trap' },
  { pattern: /\bmorgenshtern\b/i, artist: 'Morgenshtern', suggestion: 'aggressive trap, autotune vocals, club-ready beats', genre: 'trap' },
  { pattern: /\boxxxymiron(а)?\b/i, artist: 'Oxxxymiron', suggestion: 'intellectual Russian rap, complex wordplay, dark atmospheric beats', genre: 'rap' },
  { pattern: /\bоксимирон(а)?\b/i, artist: 'Оксимирон', suggestion: 'intellectual Russian rap, complex wordplay, dark atmospheric beats', genre: 'rap' },
  { pattern: /\bбаст(а|у|ой|ы)?\b/i, artist: 'Баста', suggestion: 'emotional Russian hip-hop, melodic flow, live instrumentation', genre: 'hip-hop' },
  { pattern: /\bbasta\b/i, artist: 'Basta', suggestion: 'emotional Russian hip-hop, melodic flow, live instrumentation', genre: 'hip-hop' },
  { pattern: /\bтиматии?\b/i, artist: 'Тимати', suggestion: 'commercial Russian rap, catchy hooks, club production', genre: 'pop-rap' },
  { pattern: /\btimati\b/i, artist: 'Timati', suggestion: 'commercial Russian rap, catchy hooks, club production', genre: 'pop-rap' },
  { pattern: /\bскриптонит(а)?\b/i, artist: 'Скриптонит', suggestion: 'dark atmospheric rap, lo-fi beats, introspective lyrics', genre: 'cloud rap' },
  { pattern: /\bscriptonite\b/i, artist: 'Scriptonite', suggestion: 'dark atmospheric rap, lo-fi beats, introspective lyrics', genre: 'cloud rap' },
  { pattern: /\bегор\s*крид(а)?\b/i, artist: 'Егор Крид', suggestion: 'romantic pop-rap, catchy melodies, R&B influences', genre: 'pop' },
  { pattern: /\bхаски\b/i, artist: 'Хаски', suggestion: 'aggressive punk-rap, raw energy, provocative lyrics', genre: 'punk-rap' },
  { pattern: /\bpharaoh\b/i, artist: 'Pharaoh', suggestion: 'dark trap, melodic autotune, melancholic vibes', genre: 'trap' },
  { pattern: /\bфараон(а)?\b/i, artist: 'Фараон', suggestion: 'dark trap, melodic autotune, melancholic vibes', genre: 'trap' },
  { pattern: /\bmiyagi\b/i, artist: 'Miyagi', suggestion: 'reggae-influenced hip-hop, positive vibes, smooth flow', genre: 'reggae-rap' },
  { pattern: /\bмияги\b/i, artist: 'Мияги', suggestion: 'reggae-influenced hip-hop, positive vibes, smooth flow', genre: 'reggae-rap' },
  { pattern: /\bjah\s*khalib\b/i, artist: 'Jah Khalib', suggestion: 'romantic urban pop, R&B vibes, smooth vocals', genre: 'R&B' },
  { pattern: /\bджах\s*халиб\b/i, artist: 'Джах Халиб', suggestion: 'romantic urban pop, R&B vibes, smooth vocals', genre: 'R&B' },
  { pattern: /\bмакс\s*корж(а)?\b/i, artist: 'Макс Корж', suggestion: 'anthemic pop-rock, stadium energy, singalong choruses', genre: 'pop-rock' },
  { pattern: /\bmax\s*korzh\b/i, artist: 'Max Korzh', suggestion: 'anthemic pop-rock, stadium energy, singalong choruses', genre: 'pop-rock' },
  { pattern: /\bnoize\s*mc\b/i, artist: 'Noize MC', suggestion: 'socially conscious rap-rock, live band energy, alternative vibes', genre: 'rap-rock' },
  { pattern: /\bнойз\s*мс\b/i, artist: 'Нойз МС', suggestion: 'socially conscious rap-rock, live band energy, alternative vibes', genre: 'rap-rock' },
  { pattern: /\bmatrang\b/i, artist: 'Matrang', suggestion: 'sad trap, emotional melodies, atmospheric production', genre: 'emo-trap' },
  
  // International Pop
  { pattern: /\btaylor\s*swift\b/i, artist: 'Taylor Swift', suggestion: 'catchy pop anthems, storytelling lyrics, emotional ballads', genre: 'pop' },
  { pattern: /\bed\s*sheeran\b/i, artist: 'Ed Sheeran', suggestion: 'acoustic pop, heartfelt vocals, folk influences', genre: 'pop' },
  { pattern: /\bdrake\b/i, artist: 'Drake', suggestion: 'melodic rap, R&B influences, emotional hip-hop', genre: 'hip-hop' },
  { pattern: /\bbeyonce\b/i, artist: 'Beyonce', suggestion: 'powerful R&B, danceable beats, empowering lyrics', genre: 'R&B' },
  { pattern: /\beminem\b/i, artist: 'Eminem', suggestion: 'fast-paced rap, complex rhymes, aggressive delivery', genre: 'rap' },
  { pattern: /\bkanye\b/i, artist: 'Kanye', suggestion: 'experimental hip-hop, gospel influences, innovative production', genre: 'hip-hop' },
  { pattern: /\bariana\s*grande\b/i, artist: 'Ariana Grande', suggestion: 'high-pitched pop vocals, R&B influence, danceable tracks', genre: 'pop' },
  { pattern: /\bbillie\s*eilish\b/i, artist: 'Billie Eilish', suggestion: 'dark pop, whispered vocals, minimalist production', genre: 'alternative pop' },
  { pattern: /\brihanna\b/i, artist: 'Rihanna', suggestion: 'Caribbean-influenced pop, dancehall vibes, powerful vocals', genre: 'pop' },
  { pattern: /\bjustin\s*bieber\b/i, artist: 'Justin Bieber', suggestion: 'pop R&B, catchy hooks, tropical house influences', genre: 'pop' },
  { pattern: /\blady\s*gaga\b/i, artist: 'Lady Gaga', suggestion: 'theatrical pop, synth-heavy production, powerful vocals', genre: 'pop' },
  { pattern: /\bbruno\s*mars\b/i, artist: 'Bruno Mars', suggestion: 'retro funk pop, groovy basslines, falsetto vocals', genre: 'funk-pop' },
  { pattern: /\bpost\s*malone\b/i, artist: 'Post Malone', suggestion: 'melodic hip-hop, rock influences, emotional hooks', genre: 'pop-rap' },
  { pattern: /\bdua\s*lipa\b/i, artist: 'Dua Lipa', suggestion: 'disco-pop, danceable grooves, retro synthesizers', genre: 'disco-pop' },
  { pattern: /\bthe\s*weeknd\b/i, artist: 'The Weeknd', suggestion: 'dark R&B, 80s synth influences, falsetto vocals', genre: 'R&B' },
  { pattern: /\badele\b/i, artist: 'Adele', suggestion: 'powerful ballads, emotional vocals, orchestral arrangements', genre: 'pop' },
  { pattern: /\bcoldplay\b/i, artist: 'Coldplay', suggestion: 'atmospheric rock, anthemic choruses, layered synths', genre: 'alternative rock' },
  { pattern: /\bimagine\s*dragons\b/i, artist: 'Imagine Dragons', suggestion: 'epic rock, powerful drums, anthemic vocals', genre: 'pop-rock' },
  
  // K-Pop - only distinctive group names (removed short/common words like ive, exo, nct, txt)
  { pattern: /\bbts\b/i, artist: 'BTS', suggestion: 'dynamic K-pop, synchronized choreography vibes, catchy hooks', genre: 'K-pop' },
  { pattern: /\bblackpink\b/i, artist: 'Blackpink', suggestion: 'girl crush K-pop, trap influences, powerful drops', genre: 'K-pop' },
  { pattern: /\btwice\b/i, artist: 'Twice', suggestion: 'bubbly K-pop, cute concept, catchy melodies', genre: 'K-pop' },
  // Removed: karina - common Russian name "Карина"
  // Removed: itzy, ive, exo, nct, txt - too short, cause false positives
  { pattern: /\ble\s*sserafim\b/i, artist: 'Le Sserafim', suggestion: 'bold K-pop, empowering lyrics, modern beats', genre: 'K-pop' },
  { pattern: /\bseventeen\b/i, artist: 'Seventeen', suggestion: 'synchronized K-pop, diverse genres, dynamic performance', genre: 'K-pop' },
  { pattern: /\benhypen\b/i, artist: 'Enhypen', suggestion: 'dark K-pop concept, powerful choreography, modern beats', genre: 'K-pop' },
  
  // Electronic / EDM
  { pattern: /\bskrillex\b/i, artist: 'Skrillex', suggestion: 'aggressive dubstep, heavy bass drops, glitchy synths', genre: 'dubstep' },
  { pattern: /\bdeadmau5\b/i, artist: 'Deadmau5', suggestion: 'progressive house, melodic synths, hypnotic beats', genre: 'house' },
  { pattern: /\bdaft\s*punk\b/i, artist: 'Daft Punk', suggestion: 'french house, vocoder vocals, funky grooves', genre: 'house' },
  { pattern: /\bmarshmello\b/i, artist: 'Marshmello', suggestion: 'future bass, euphoric drops, uplifting melodies', genre: 'EDM' },
  
  // Russian Rock / Alternative
  // Removed: девочка/devochka - common Russian word "girl"
  // Removed: сектор газа - too many false positives with "сектор" or "газ"
  
  // African Artists - only distinctive names (removed teni=shadows, mejja)
  { pattern: /\bwizkid\b/i, artist: 'Wizkid', suggestion: 'afrobeats, Nigerian pop, dancehall influence', genre: 'afrobeats' },
  { pattern: /\bdavido\b/i, artist: 'Davido', suggestion: 'afrobeats, high-energy, party anthems', genre: 'afrobeats' },
  { pattern: /\bburna\s*boy\b/i, artist: 'Burna Boy', suggestion: 'afrofusion, dancehall, reggae vibes', genre: 'afrobeats' },
  
  // K-Pop additional - only distinctive names
  { pattern: /\bg-idle\b/i, artist: 'G-IDLE', suggestion: 'girl crush K-pop, powerful vocals, EDM drops', genre: 'K-pop' },
  { pattern: /\baespa\b/i, artist: 'Aespa', suggestion: 'futuristic K-pop, electronic, powerful vocals', genre: 'K-pop' },
  { pattern: /\bnewjeans\b/i, artist: 'NewJeans', suggestion: 'Y2K pop, nostalgic R&B, fresh K-pop sound', genre: 'K-pop' },
  { pattern: /\bstray\s*kids\b/i, artist: 'Stray Kids', suggestion: 'intense K-pop, hip-hop influence, powerful beats', genre: 'K-pop' },
  
  // Latin - only distinctive multi-word names
  // Removed: lany, chika, poli, tena - too short/common
  { pattern: /\bbad\s*bunny\b/i, artist: 'Bad Bunny', suggestion: 'reggaeton, Latin trap, party vibes', genre: 'reggaeton' },
  { pattern: /\bj\s*balvin\b/i, artist: 'J Balvin', suggestion: 'reggaeton, Latin pop, danceable rhythms', genre: 'reggaeton' },
  { pattern: /\bkarol\s*g\b/i, artist: 'Karol G', suggestion: 'reggaeton, Latin urban, empowering lyrics', genre: 'reggaeton' },
  
  // Removed common Russian names that cause false positives:
  // - миша/misha (common name Misha)
  // - аня/ania (common name Anya)  
  // - класс/klass (common word "class")
  // - максим/maksim (common name Maxim)
  // - мирами/mirami (uncommon, low risk)
  
  // Russian pop stars (commonly referenced)
  { pattern: /\bленинград\b/i, artist: 'Ленинград', suggestion: 'Russian ska-punk, satirical lyrics, brass section, party vibes', genre: 'ska-punk' },
  { pattern: /\bleningrad\b/i, artist: 'Leningrad', suggestion: 'Russian ska-punk, satirical lyrics, brass section, party vibes', genre: 'ska-punk' },
  { pattern: /\bземфира\b/i, artist: 'Земфира', suggestion: 'Russian alternative rock, introspective lyrics, unique vocals', genre: 'alternative rock' },
  { pattern: /\bzemfira\b/i, artist: 'Zemfira', suggestion: 'Russian alternative rock, introspective lyrics, unique vocals', genre: 'alternative rock' },
  { pattern: /\bмонеточка\b/i, artist: 'Монеточка', suggestion: 'indie pop, youthful vocals, nostalgic synths, lo-fi production', genre: 'indie-pop' },
  { pattern: /\bmonetochka\b/i, artist: 'Monetochka', suggestion: 'indie pop, youthful vocals, nostalgic synths, lo-fi production', genre: 'indie-pop' },
  { pattern: /\bslava\s*marlow\b/i, artist: 'Slava Marlow', suggestion: 'hyperpop, autotune, experimental beats, viral energy', genre: 'hyperpop' },
  { pattern: /\bслава\s*марлоу\b/i, artist: 'Слава Марлоу', suggestion: 'hyperpop, autotune, experimental beats, viral energy', genre: 'hyperpop' },
  { pattern: /\bbig\s*baby\s*tape\b/i, artist: 'Big Baby Tape', suggestion: 'aggressive trap, hard 808s, braggadocious flow', genre: 'trap' },
  { pattern: /\bбиг\s*бейби\s*тейп\b/i, artist: 'Биг Бейби Тейп', suggestion: 'aggressive trap, hard 808s, braggadocious flow', genre: 'trap' },
  { pattern: /\bkizaru\b/i, artist: 'Kizaru', suggestion: 'cloud rap, dreamy beats, melodic flow, atmospheric', genre: 'cloud rap' },
  { pattern: /\bкизару\b/i, artist: 'Кизару', suggestion: 'cloud rap, dreamy beats, melodic flow, atmospheric', genre: 'cloud rap' },
];

/**
 * Find artist in text and return replacement suggestion
 */
export function findArtistReplacement(text: string): ArtistReplacement | null {
  if (!text) return null;
  
  for (const replacement of ARTIST_REPLACEMENTS) {
    if (replacement.pattern.test(text)) {
      return replacement;
    }
  }
  
  return null;
}

/**
 * Replace artist mentions with genre descriptions
 */
export function replaceArtistsWithGenres(text: string): { 
  newText: string; 
  replacements: Array<{ original: string; replacement: string }>;
} {
  let newText = text;
  const replacements: Array<{ original: string; replacement: string }> = [];
  
  for (const { pattern, artist, suggestion } of ARTIST_REPLACEMENTS) {
    const match = newText.match(pattern);
    if (match) {
      // Replace common phrases like "как X", "в стиле X", "похоже на X"
      const contextPatterns = [
        new RegExp(`(как|в стиле|похоже на|типа|вроде)\\s*${pattern.source}`, 'gi'),
        new RegExp(`(like|similar to|style of)\\s*${pattern.source}`, 'gi'),
        pattern,
      ];
      
      for (const contextPattern of contextPatterns) {
        if (contextPattern.test(newText)) {
          newText = newText.replace(contextPattern, suggestion);
          replacements.push({ original: artist, replacement: suggestion });
          break;
        }
      }
    }
  }
  
  return { newText, replacements };
}

/**
 * Get quick genre suggestions based on detected artist
 */
export function getGenreSuggestions(artist: ArtistReplacement): string[] {
  const suggestions = [artist.suggestion];
  
  // Add related genre variations
  switch (artist.genre) {
    case 'trap':
      suggestions.push('808 bass, hi-hats, dark melody', 'hard-hitting beats, aggressive flow');
      break;
    case 'rap':
    case 'hip-hop':
      suggestions.push('boom bap, old school hip-hop', 'lyrical rap, conscious hip-hop');
      break;
    case 'pop':
      suggestions.push('upbeat pop, catchy melody', 'radio-friendly, mainstream pop');
      break;
    case 'R&B':
      suggestions.push('smooth R&B, soulful vocals', 'modern R&B, chill vibes');
      break;
    case 'K-pop':
      suggestions.push('energetic pop, dance track', 'Asian pop influences, electronic');
      break;
    case 'dubstep':
      suggestions.push('heavy bass, wobble synths', 'electronic drops, aggressive EDM');
      break;
    case 'house':
    case 'EDM':
      suggestions.push('four-on-the-floor, synth melodies', 'dance music, electronic beats');
      break;
    case 'punk-rock':
      suggestions.push('fast guitars, raw energy', 'rebellious rock, garage sound');
      break;
    case 'afrobeats':
      suggestions.push('tropical percussion, danceable groove', 'African rhythms, party vibes');
      break;
    case 'synth-pop':
    case 'indie-pop':
    case 'indie':
      suggestions.push('dreamy synths, atmospheric', 'indie vibes, alternative sound');
      break;
  }
  
  return suggestions;
}
