<div align="center">

![MusicVerse Logo](src/assets/logo.png)

# 🎵 MusicVerse AI

![MusicVerse Banner](src/assets/banner.png)

### Профессиональная AI-платформа для создания музыки

[![Made with Lovable](https://img.shields.io/badge/Made%20with-Lovable-ff69b4.svg)](https://lovable.dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Telegram](https://img.shields.io/badge/Telegram-Mini%20App-26A5E4?logo=telegram)](https://core.telegram.org/bots/webapps)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ECF8E?logo=supabase)](https://supabase.com/)

[![Meta Tags](https://img.shields.io/badge/Meta%20Tags-174+-ff6b6b?logo=music&logoColor=white)](https://github.com/yourusername/musicverse)
[![Music Styles](https://img.shields.io/badge/Music%20Styles-277+-9b59b6?logo=spotify&logoColor=white)](https://github.com/yourusername/musicverse)
[![Languages](https://img.shields.io/badge/Languages-75+-3498db?logo=googletranslate&logoColor=white)](https://github.com/yourusername/musicverse)
[![Suno API](https://img.shields.io/badge/Suno%20API-v5-e74c3c?logo=soundcloud&logoColor=white)](https://docs.sunoapi.org)

[📖 Документация](#-документация) • [🚀 Быстрый старт](#-быстрый-старт) • [🎼 Meta Tags](#-suno-meta-tags-174) • [🎸 Стили](#-музыкальные-стили-277) • [🌍 Языки](#-поддерживаемые-языки-75)

![MusicVerse Banner](docs/images/banner.png)

</div>

---

## 📑 Содержание

<details>
<summary>Развернуть оглавление</summary>

- [О проекте](#-о-проекте)
- [Ключевые метрики](#-ключевые-метрики)
- [Возможности](#-возможности)
- [Suno Meta Tags (174+)](#-suno-meta-tags-174)
- [Музыкальные стили (277+)](#-музыкальные-стили-277)
- [Поддерживаемые языки (75+)](#-поддерживаемые-языки-75)
- [Архитектура](#-архитектура)
- [FAQ (Часто задаваемые вопросы)](#-faq-часто-задаваемые-вопросы)
- [База данных](#-база-данных)
- [Быстрый старт](#-быстрый-старт)
- [Технологии](#-технологии)
- [API Reference](#-api-reference)
- [Документация](#-документация)
- [Deployment](#-deployment)
- [Лицензия](#-лицензия)

</details>

---

## 🎯 О проекте

**MusicVerse AI** — это профессиональная платформа для создания музыки с помощью искусственного интеллекта, реализованная как Telegram Mini App. Платформа предоставляет доступ к **Suno AI API v5** с поддержкой **174+ мета-тегов**, **277+ музыкальных стилей** и **75+ языков** для генерации музыки мирового класса.

### ✨ Ключевые особенности

<table>
<tr>
<td width="50%">

#### 🤖 AI-генерация
- **Suno AI v5** (chirp-crow)
- 174+ мета-тегов контроля
- 277+ музыкальных стилей
- 75+ языков вокала
- Кастомная лирика
- Инструментальные треки

</td>
<td width="50%">

#### 🎛️ Профессиональный контроль
- Графовая система тегов
- Рекомендации стилей
- Конструктор промптов
- История генераций
- Пользовательские шаблоны
- Избранные теги

</td>
</tr>
<tr>
<td width="50%">

#### 🎭 Управление проектами
- Альбомы и EP
- AI-концепции
- Обложки (AI генерация)
- Артисты и коллаборации
- Русская локализация
- Версионирование

</td>
<td width="50%">

#### 📱 Telegram Integration
- Mini App SDK
- OAuth 2.0 авторизация
- Haptic Feedback
- Cloud Storage
- Native UI
- Push уведомления

</td>
</tr>
</table>

---

## 📊 Ключевые метрики

<div align="center">

| Категория | Количество | Описание |
|-----------|-----------|----------|
| 🏷️ **Meta Tags** | **174+** | Полный контроль над генерацией |
| 🎸 **Music Styles** | **277+** | Уникальные жанровые комбинации |
| 🌍 **Languages** | **75+** | Поддержка вокала на разных языках |
| 🎨 **Genres** | **50+** | Основные музыкальные жанры |
| 🎵 **Instruments** | **40+** | Виртуальные инструменты |
| 🎭 **Moods** | **30+** | Эмоциональные атмосферы |
| ⚙️ **Effects** | **25+** | Звуковые эффекты и обработка |
| 🔗 **Tag Relations** | **500+** | Графовые связи между тегами |

</div>

---

## 🎨 Возможности

### 🎼 Генерация треков

```typescript
// Простая генерация
{
  prompt: "Upbeat electronic dance music with catchy hooks",
  model: "chirp-crow",
  instrumental: false
}

// Профессиональный контроль с Meta Tags
{
  title: "Cosmic Journey",
  prompt: "[Verse]\nWalking through the stars...\n[Chorus]\nCosmic journey high...",
  style: "[Genre: Ambient Electronic] [Mood: Ethereal, Dreamy] [Instrument: Synthesizer, Pad] [Vocal Style: Breathy] [Texture: Wide Stereo, Reverb-Soaked]",
  model: "chirp-crow"
}
```

**Доступные модели:**

| Модель | Идентификатор | Статус | Промпт | Стиль | Описание |
|--------|--------------|--------|--------|-------|----------|
| v3.5 | `chirp-v3.5` | Deprecated | 3000 | 200 | Устаревшая версия |
| v4 | `chirp-v4` | Stable | 3000 | 200 | Надежная генерация |
| v4.5 | `chirp-auk` | Active | 5000 | 1000 | Улучшенный контроль |
| v4.5+ | `chirp-bluejay` | Active | 5000 | 1000 | Стабильность |
| **v5** | **`chirp-crow`** | **Latest** | **5000** | **1000** | **Лучшее качество** |

### 📁 Проекты

- **Типы**: Single, EP, Album, OST, Background Music, Jingle, Compilation, Mixtape
- **AI-концепции**: Автоматическая генерация концепции проекта
- **Обложки**: Загрузка или AI-генерация с помощью Gemini
- **Артисты**: Создание и управление артистами
- **Треклисты**: AI-генерация структуры альбома
- **Локализация**: Русские переводы названий

### 🔍 Интеллектуальная система

- **Графовая БД**: Связи между тегами (complements, conflicts, enhances, requires)
- **Рекомендации**: Персональные предложения стилей на основе истории
- **Конструктор**: Визуальный построитель промптов
- **Шаблоны**: Сохранение и повторное использование промптов
- **Аналитика**: Отслеживание успешных генераций

---

## 🏷️ Suno Meta Tags (174+)

Meta Tags — это мощные теги управления в квадратных скобках `[Tag]`, которые дают точный контроль над генерацией музыки.

### Категории тегов

<details>
<summary><b>📐 Structure (8 тегов)</b> - Структура композиции</summary>

| Тег | Назначение | Пример использования |
|-----|-----------|---------------------|
| `[Intro]` | Вступление | `[Intro] Soft piano melody` |
| `[Verse]` | Куплет | `[Verse] Main story lyrics` |
| `[Pre-Chorus]` | Пред-припев | `[Pre-Chorus] Building tension` |
| `[Chorus]` | Припев | `[Chorus] Main hook, memorable` |
| `[Bridge]` | Бридж | `[Bridge] Different perspective` |
| `[Drop]` | Дроп | `[Drop] Heavy bass kicks in` |
| `[Outro]` | Окончание | `[Outro] Fade out slowly` |
| `[Break]` | Брейк | `[Break] Instrumental pause` |

</details>

<details>
<summary><b>🎤 Vocal Control (27 тегов)</b> - Управление вокалом</summary>

#### Пол и тип вокалиста

| Тег | Описание | V4.5+ Формат |
|-----|---------|-------------|
| `[Male Vocal]` | Мужской вокал | `[Vocalist: Male]` |
| `[Female Vocal]` | Женский вокал | `[Vocalist: Female]` |
| `[Choir]` | Хор | `[Choir]` |
| `[Choir Pad]` | Хоровой пэд | `[Choir Pad]` |

#### Стиль вокала

| Тег | Эффект |
|-----|--------|
| `[Vocal Style: Smooth]` | Плавный вокал |
| `[Vocal Style: Raspy]` | Хриплый вокал |
| `[Vocal Style: Operatic]` | Оперный стиль |
| `[Vocal Style: Breathy]` | Дыхательный |
| `[Vocal Style: Gospel]` | Госпел стиль |
| `[Falsetto]` | Фальцет |
| `[Whisper]` | Шепот |
| `[Ad-libs]` | Импровизации |
| `[Harmony Vocals]` | Гармонии |

#### Языки (75+ доступных)

```
[Language: English]  [Language: Spanish]  [Language: French]
[Language: Russian]  [Language: Japanese] [Language: Korean]
[Language: Chinese]  [Language: German]   [Language: Italian]
[Language: Portuguese] [Language: Arabic] [Language: Hindi]
... и еще 63+ языка!
```

#### Акценты

```
[Accent: American]  [Accent: British]  [Accent: Australian]
```

</details>

<details>
<summary><b>🎸 Instruments (40+ тегов)</b> - Музыкальные инструменты</summary>

#### Клавишные

```
[Piano]  [Electric Piano]  [Keyboard]  [Organ]  [Synth]  [Harpsichord]
```

#### Струнные

```
[Guitar]  [Electric Guitar]  [Electric Guitar (Distorted)]
[Acoustic Guitar]  [Bass]  [Violin]  [Cello]  [Harp]
[Ukulele]  [Banjo]  [Mandolin]  [Sitar]
```

#### Духовые

```
[Saxophone]  [Trumpet]  [Trombone]  [Flute]  [Clarinet]
[Harmonica]  [Horns]  [Bagpipe]
```

#### Ударные и перкуссия

```
[Drums]  [808s]  [808 Bass]  [Hi-Hats]  [Snare]  [Kick]
[Kick and Snare]  [Percussion]  [Tambourine]  [Tabla]
```

#### Оркестр

```
[Strings]  [Strings (Legato)]  [Brass]  [Woodwinds]
[String Ensemble]  [Orchestra]
```

#### Этнические

```
[Koto]  [Sitar]  [Tabla]  [Didgeridoo]  [Shamisen]
```

</details>

<details>
<summary><b>🎭 Genre & Style (50+ тегов)</b> - Жанры и стили</summary>

#### Основные жанры

```
[Genre: Pop]           [Genre: Rock]          [Genre: Jazz]
[Genre: Electronic]    [Genre: Hip-Hop]       [Genre: R&B]
[Genre: Classical]     [Genre: Country]       [Genre: Metal]
[Genre: Folk]          [Genre: Reggae]        [Genre: Blues]
[Genre: Soul]          [Genre: Funk]          [Genre: Gospel]
[Genre: Latin]         [Genre: Indie]         [Genre: Punk]
```

#### Электронные поджанры

```
[Genre: House]         [Genre: Techno]        [Genre: Trance]
[Genre: Dubstep]       [Genre: Drum & Bass]   [Genre: Ambient]
[Genre: IDM]           [Genre: Breakbeat]     [Genre: Garage]
```

#### Стили

```
[Style: Lo-fi]         [Style: K-pop]         [Style: Synthwave]
[Style: Chillstep]     [Style: Ambient]       [Style: Psychedelic]
[Style: Grunge]        [Style: Shoegaze]      [Style: Vaporwave]
```

#### Эры

```
[Era: 80s]  [Era: 90s]  [Era: 2000s]  [Era: Retro]  [Era: Modern]
```

</details>

<details>
<summary><b>😊 Mood & Energy (30+ тегов)</b> - Настроение и энергия</summary>

#### Настроения

```
[Mood: Happy]          [Mood: Sad]            [Mood: Energetic]
[Mood: Chill]          [Mood: Dark]           [Mood: Romantic]
[Mood: Melancholic]    [Mood: Upbeat]         [Mood: Dramatic]
[Mood: Heroic]         [Mood: Ominous]        [Mood: Euphoric]
[Mood: Nostalgic]      [Mood: Mysterious]     [Mood: Aggressive]
```

#### Энергия

```
[Energy: High]   [Energy: Medium]   [Energy: Low]
```

#### Темп

```
[BPM: 60]  [BPM: 80]  [BPM: 100]  [BPM: 120]  [BPM: 140]  [BPM: 160]
```

</details>

<details>
<summary><b>🎚️ Production & Texture (25+ тегов)</b> - Продакшн и текстура</summary>

#### Текстуры

```
[Texture: Reverb-Soaked]    [Texture: Dry]
[Texture: Wet]              [Texture: Tape-Saturated]
[Texture: Wide Stereo]      [Texture: Mono]
[Texture: Gentle Sidechain] [Texture: Sidechained]
```

#### Микс

```
[Mix: Compressed]   [Mix: Dynamic]   [Mix: Bright]
[Mix: Warm]         [Mix: Clean]     [Mix: Lo-Fi]
```

#### Продакшн

```
[Production: Layered]   [Production: Sparse]   [Production: Lush]
[Production: Raw]       [Production: Polished]
```

#### Качество

```
[Quality: Lo-Fi]   [Quality: High-Fi]   [Quality: Studio]
[Quality: Live]    [Quality: Demo]
```

</details>

<details>
<summary><b>⚡ Effects & Processing (20+ тегов)</b> - Эффекты и обработка</summary>

#### Основные эффекты

```
[Reverb]      [Echo]        [Delay]       [Chorus]
[Flange]      [Phaser]      [Distortion]  [Overdrive]
[Compression] [Limiter]     [Gate]
```

#### Эквалайзер

```
[EQ: Bright]        [EQ: Warm]          [EQ: Bass Boost]
[EQ: Treble Boost]  [EQ: Mid Scoop]
```

#### Специальные

```
[Filter Sweep]   [Auto-Tune]   [Vocoder]   [Talk Box]
[Bit Crush]      [Ring Mod]
```

#### Динамика

```
[Fade In]   [Fade Out]   [Crossfade]   [Volume Automation]
```

</details>

<details>
<summary><b>🎬 Special Effects (18+ тегов)</b> - Спецэффекты и атмосфера</summary>

#### Атмосфера

```
[Applause]           [Live Version]       [Studio Recording]
[Live Recording]     [Field Recording]    [Crowd Noise]
```

#### Природа

```
[Birds Chirping]   [Rain]   [Thunder]   [Wind]   [Ocean Waves]
[Nature Ambience]  [Forest Sounds]
```

#### Городские

```
[Urban Ambience]   [Traffic Noise]   [City Sounds]
```

#### Винтажные

```
[Vinyl Crackle]   [Record Skip]   [Tape Hiss]
[Radio Effect]    [Telephone Effect]
```

#### Цифровые

```
[8-Bit]   [16-Bit]   [Bit-Crushed]   [Glitch]
```

</details>

<details>
<summary><b>🔄 Transitions & Dynamics (15+ тегов)</b> - Переходы и динамика</summary>

#### Темповые изменения

```
[Half-Time]   [Double-Time]   [Drop to Half-Time]
[Tempo Change]
```

#### Модуляции

```
[Key Change]   [Key Modulation]   [Chord Progression]
```

#### Динамические изменения

```
[Bass Drop]    [Build]        [Breakdown]
[Crescendo]    [Decrescendo]  [Silence]
```

#### Структурные

```
[Loop-Friendly]           [Structure: Seamless Loop]
[Final Chorus Lift]       [Anthemic Chorus]
[Filter Cutoff]
```

</details>

<details>
<summary><b>📼 Format Tags (6 тегов)</b> - Форматы вывода</summary>

```
[Stereo]   [Mono]   [Surround]
[Ambisonics]   [Binaural]   [Spatial Audio]
```

</details>

### Использование Meta Tags

#### Формат v4.5+ (Рекомендуется)

```
[Category: Value, Value2, Value3]
```

**Примеры:**
```
[Genre: Orchestral Trap]
[Mood: Heroic, Dramatic]
[Texture: Tape-Saturated, Wide Stereo]
[Instrument: 808s, String Ensemble]
[Vocal Style: Gospel]
[Language: Russian]
```

#### Комбинирование тегов

```typescript
const style = `
  [Genre: Ambient Electronic]
  [Mood: Dreamy, Ethereal]
  [Instrument: Synthesizer, Pad, Piano]
  [Vocal Style: Breathy]
  [Language: English]
  [Texture: Wide Stereo, Reverb-Soaked]
  [Mix: Warm]
  [Energy: Low]
`;
```

---

## 🎸 Музыкальные стили (277+)

База данных содержит **277 уникальных музыкальных стилей** с географическими влияниями, настроениями и жанровыми комбинациями.

### Распределение по основным жанрам

<div align="center">

| Жанр | Количество | Примеры |
|------|-----------|---------|
| 🎺 **Jazz** | 13 | afro-jazz, raga jazz, prog avant-garde jazz |
| 🎸 **Rock** | 16 | grunge, alternative rock, psychedelic rock |
| 🎹 **Electronic** | 14 | ambient techno, synthwave, dubstep |
| 🎤 **Hip-Hop/Rap** | 11 | trap, boom bap, cloud rap |
| 🎵 **Pop** | 16 | k-pop, synthpop, dream pop |
| 🌴 **Latin** | 11 | cumbia, reggaeton, samba, bachata |
| 🎻 **Classical** | 10 | symphonic, orchestral arrangements |
| 🎺 **Blues** | 13 | delta blues, acoustic blues |
| 🎸 **Funk/Soul** | 14 | afro-funk, neo-soul, electro-soul |
| 🌾 **Folk** | 6 | bluegrass, cajun, celtic folk |
| 🏝️ **Reggae** | 9 | roots reggae, arabic reggae |

</div>

### География музыки

<details>
<summary><b>🌍 Африка (23 стиля)</b></summary>

```
afro-jazz, afro-funk, afro-cuban jazz, dakar afro-cuban jazz,
afro trap, afrobeat, afro house, grunge african folk, tuareg synthwave,
koto gnawa, saxophone gnawa, prog afrobeat, prog afro-jazz,
prog afro-funk, afro-cuban jazz griot, afro-cuban jazz doo-wop,
afro-cuban jazz crunk, arabic afrobeat, saxon afro house
```

</details>

<details>
<summary><b>🌏 Азия (20+ стилей)</b></summary>

**Восточная Азия:**
```
k-pop, korean pacific reggae, koto gnawa, koto g-funk,
koto drill and bass, koto dembow, koto coptic, koto boom bap,
koto alt-pop, mandarin trance, mandarin math rock, mandarin house,
mandarin hawaiian, mandarin disco
```

**Южная Азия:**
```
raga jazz, hindi jungle, hindi dream pop, urdu rumba, urdu jazzwave,
hindi chanson, urdu house, hindi carnatic, urdu electropop,
urdu drill, hindi bubblegum dance, urdu coptic
```

</details>

<details>
<summary><b>🌎 Америка (15+ стилей)</b></summary>

**Северная Америка:**
```
new orleans grunge, new orleans dembow, new orleans cloud rap,
new orleans chillwave, new orleans carnatic, new orleans cajun,
new orleans alternative r&b, delta blues house, americana,
bluegrass, cajun
```

**Латинская Америка:**
```
sertanejo southern rock, sertanejo chillstep, sertanejo emo,
spanish samba, spanish merengue, cumbia, reggaeton
```

</details>

<details>
<summary><b>🌍 Ближний Восток (12 стилей)</b></summary>

```
arabic reggae, arabic pop, arabic mariachi, arabic egyptian,
arabic classical, arabic ambient techno, arabic afrobeat,
arabic acid house, hyphy egyptian, egyptian swing
```

</details>

<details>
<summary><b>🌍 Европа (10+ стилей)</b></summary>

```
portuguese breakbeat, portuguese barbershop, portuguese acoustic rock,
portuguese 16-bit, russian dembow, choral celtic, celtic folk,
klezmer pop
```

</details>

### Фьюжн-стили (Топ 50)

```
orchestral trap          jazz-hop                electro-swing
lofi hip hop             ambient dub techno      synthwave funk
trap soul                reggae jazz             rock opera
electronic blues         psychedelic folk        industrial metal
country hip-hop          classical electronic    afro house
latin jazz               reggaeton pop           grunge pop
indie electronic         folk metal              progressive trap
ambient rock             chillwave soul          dream reggae
acoustic electronic      baroque pop             celtic punk
gospel trap              bluegrass metal         surf rock jazz
desert blues             tropical house          dark ambient
space rock               witch house             vaporwave soul
experimental hip-hop     neo-classical edm       glitch hop
tribal house             minimal techno          future funk
acid jazz                intelligent dnb         progressive house
```

### Атмосферные стили

<details>
<summary><b>😴 Dreamy / Chill (15 стилей)</b></summary>

```
dreamy swing, dreamy soul, dreamy shoegaze, dreamy pacific reggae,
dreamy house, dreamy grime, dreamy fife and drum blues,
chillwave, chillstep, lo-fi hip hop, ambient, downtempo
```

</details>

<details>
<summary><b>🌑 Dark (12 стилей)</b></summary>

```
dark goa trance, dark electropop, dark drum and bass, dark dance,
dark coptic, dark chillstep, dark blues, dark alternative rock,
darkwave, dark ambient, industrial, witch house
```

</details>

<details>
<summary><b>😴 Hypnagogic (8 стилей)</b></summary>

```
hypnagogic pacific reggae, hypnagogic goa trance, hypnagogic garage,
hypnagogic electropop, hypnagogic ambient trance, hypnagogic algorave,
hypnagogic pop, hypnagogic drift
```

</details>

---

## 🌍 Поддерживаемые языки (75+)

MusicVerse поддерживает вокальную генерацию на **75+ языках** мира с автоматическим определением произношения.

### Европейские языки (25+)

```
🇬🇧 English        🇪🇸 Spanish       🇫🇷 French        🇩🇪 German
🇮🇹 Italian        🇵🇹 Portuguese    🇷🇺 Russian       🇵🇱 Polish
🇳🇱 Dutch          🇸🇪 Swedish       🇳🇴 Norwegian     🇩🇰 Danish
🇫🇮 Finnish        🇬🇷 Greek         🇨🇿 Czech         🇭🇺 Hungarian
🇷🇴 Romanian       🇺🇦 Ukrainian     🇧🇬 Bulgarian     🇭🇷 Croatian
🇸🇰 Slovak         🇸🇮 Slovenian     🇱🇹 Lithuanian    🇱🇻 Latvian
🇪🇪 Estonian
```

### Азиатские языки (20+)

```
🇨🇳 Chinese (Mandarin)    🇯🇵 Japanese        🇰🇷 Korean
🇮🇳 Hindi                🇮🇳 Bengali         🇵🇰 Urdu
🇮🇳 Tamil                🇮🇳 Telugu          🇮🇳 Marathi
🇹🇭 Thai                 🇻🇳 Vietnamese      🇮🇩 Indonesian
🇲🇾 Malay                🇵🇭 Filipino        🇰🇭 Khmer
🇲🇲 Burmese              🇱🇦 Lao             🇲🇳 Mongolian
🇰🇿 Kazakh               🇺🇿 Uzbek
```

### Ближневосточные (10+)

```
🇸🇦 Arabic         🇮🇷 Persian        🇹🇷 Turkish       🇮🇱 Hebrew
🇦🇫 Pashto         🇦🇫 Dari           🇮🇶 Kurdish       🇦🇿 Azerbaijani
🇦🇲 Armenian       🇬🇪 Georgian
```

### Африканские (8+)

```
🇿🇦 Afrikaans      🇿🇦 Zulu           🇪🇹 Amharic       🇰🇪 Swahili
🇳🇬 Yoruba         🇳🇬 Igbo           🇿🇦 Xhosa         🇸🇴 Somali
```

### Другие (12+)

```
🇦🇷 Spanish (Latin America)    🇧🇷 Portuguese (Brazil)
🇨🇦 French (Canadian)          🇨🇭 Swiss German
🇦🇹 Austrian German            🇲🇽 Spanish (Mexican)
🇨🇴 Spanish (Colombian)        🇪🇸 Catalan
🇪🇸 Basque                     🇪🇸 Galician
🇮🇪 Irish Gaelic               🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scottish Gaelic
```

### Использование в генерации

```typescript
// Английский (по умолчанию)
style: "[Language: English] [Genre: Pop]"

// Русский
style: "[Language: Russian] [Genre: Rock] [Mood: Energetic]"

// Многоязычный микс
style: "[Language: Spanish, English] [Genre: Latin Pop]"

// С акцентом
style: "[Language: English] [Accent: British] [Genre: Indie Rock]"
```

---

## 🏗️ Архитектура

### Компоненты архитектуры

- **Frontend (React + Vite):** Пользовательский интерфейс, реализованный как Telegram Mini App. Использует React для построения UI, Vite для быстрой сборки, и Tailwind CSS для стилизации.
- **Backend (Supabase Edge Functions):** Бессерверные функции, написанные на Deno (TypeScript), которые выступают в роли безопасного API-шлюза. Они обрабатывают аутентификацию, взаимодействие с Suno AI API и другие серверные задачи. **Ключевой принцип: клиент никогда не взаимодействует с внешними API напрямую.**
- **База данных (Supabase PostgreSQL):** Надежная реляционная база данных для хранения информации о пользователях, треках, проектах и тегах. Безопасность обеспечивается на уровне строк (Row Level Security).
- **Аутентификация (Telegram OAuth):** Безопасный вход через Telegram. `initData` пользователя валидируется на бэкенде с помощью HMAC-SHA256, что гарантирует подлинность данных.
- **AI-генерация (Suno AI API):** Взаимодействие с API для генерации музыки происходит исключительно через Edge Functions, что защищает API-ключ.

---

## ❓ FAQ (Часто задаваемые вопросы)

**В: Почему используется Supabase, а не Firebase?**
**О:** Supabase предоставляет полноценный PostgreSQL, что дает нам гибкость реляционной базы данных и возможность писать сложные SQL-запросы, например, для системы рекомендаций. Edge Functions на Deno (TypeScript) обеспечивают отличную производительность и безопасность.

**В: Насколько безопасна аутентификация через Telegram?**
**О:** Аутентификация полностью безопасна. Мы используем официальный метод проверки `initData` от Telegram с помощью HMAC-валидации на сервере. Это исключает возможность подделки данных.

**В: Могу ли я запустить проект локально без Telegram?**
**О:** Да! В проекте реализован полноценный mock-режим, который эмулирует окружение Telegram, позволяя вести разработку и тестирование в обычном браузере.

---

## 🗄️ База данных

MusicVerse использует **графовую структуру данных** для хранения и управления мета-тегами, стилями и их взаимосвязями.

### Основные таблицы

#### 🏷️ suno_meta_tags (174+ записи)
```sql
- id: UUID
- tag_name: VARCHAR(100) UNIQUE
- category: ENUM(structure, vocal, instrument, ...)
- description: TEXT
- syntax_format: VARCHAR(200)
- is_explicit_format: BOOLEAN
- compatible_models: VARCHAR[]
- usage_examples: TEXT[]
```

#### 🎸 music_styles (277+ записей)
```sql
- id: UUID
- style_name: VARCHAR(200) UNIQUE
- primary_genre: VARCHAR(100)
- geographic_influence: VARCHAR[]
- mood_atmosphere: VARCHAR[]
- is_fusion: BOOLEAN
- popularity_score: INTEGER
```

#### 🔗 tag_relationships (500+ связей)
```sql
- id: UUID
- tag_id: UUID → suno_meta_tags
- related_tag_id: UUID → suno_meta_tags
- relationship_type: VARCHAR (complements, conflicts, enhances, requires)
- strength: INTEGER (1-10)
```

#### 🎨 style_tag_mappings
```sql
- id: UUID
- style_id: UUID → music_styles
- tag_id: UUID → suno_meta_tags
- relevance_score: INTEGER (1-10)
- is_primary: BOOLEAN
```

#### 👤 user_tag_preferences
```sql
- id: UUID
- user_id: UUID
- tag_id: UUID → suno_meta_tags
- style_id: UUID → music_styles
- usage_count: INTEGER
- is_favorite: BOOLEAN
- last_used_at: TIMESTAMPTZ
```

#### 📝 prompt_templates
```sql
- id: UUID
- user_id: UUID
- name: VARCHAR(200)
- template_text: TEXT
- tags: UUID[]
- style_id: UUID → music_styles
- is_public: BOOLEAN
- usage_count: INTEGER
```

#### 📊 generation_tag_usage
```sql
- id: UUID
- user_id: UUID
- track_id: UUID → tracks
- tags_used: UUID[]
- style_id: UUID → music_styles
- prompt_text: TEXT
- success: BOOLEAN
```

### Функции БД

#### get_complementary_tags(_tag_id, _max_depth)
Рекурсивный поиск совместимых тегов в графе отношений.

```sql
SELECT * FROM get_complementary_tags('tag-uuid', 2);
-- Возвращает: tag_id, tag_name, relationship_type, strength, depth
```

#### build_suno_prompt(_tag_ids[], _style_id)
Автоматическое построение промпта из тегов и стиля.

```sql
SELECT build_suno_prompt(
  ARRAY['tag1-uuid', 'tag2-uuid'],
  'style-uuid'
);
-- Возвращает: "[Genre: Jazz] [Mood: Chill] [Instrument: Piano]"
```

#### recommend_styles_for_user(_user_id, _limit)
Персональные рекомендации на основе истории использования.

```sql
SELECT * FROM recommend_styles_for_user('user-uuid', 10);
-- Возвращает: style_id, style_name, recommendation_score
```

---

## 🚀 Быстрый старт

### Предварительные требования

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Установка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/yourusername/musicverse.git
cd musicverse

# 2. Установить зависимости
npm install

# 3. Запустить dev-сервер
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

### Development Mode

В режиме разработки автоматически включается:
- ✅ Mock Telegram окружение
- ✅ Email/password аутентификация
- ✅ Тестовые данные пользователя
- ✅ Полная функциональность без Telegram

---

## 🛠️ Технологии

<div align="center">

### Frontend Stack

![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Framer](https://img.shields.io/badge/Framer_Motion-12.0-0055FF?style=for-the-badge&logo=framer)

### Backend Stack

![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ECF8E?style=for-the-badge&logo=supabase)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Edge Functions](https://img.shields.io/badge/Edge_Functions-Deno-000000?style=for-the-badge&logo=deno)

### AI/ML Stack

![Suno](https://img.shields.io/badge/Suno_AI-v5-e74c3c?style=for-the-badge&logo=soundcloud)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5-4285F4?style=for-the-badge&logo=google)
![GPT-5](https://img.shields.io/badge/OpenAI_GPT--5-412991?style=for-the-badge&logo=openai)

### Platform

![Telegram](https://img.shields.io/badge/Telegram-Mini_App-26A5E4?style=for-the-badge&logo=telegram)

</div>

<details>
<summary><b>Подробный список</b></summary>

**Frontend:**
- React 18.3
- TypeScript 5.0
- Vite (build tool)
- Tailwind CSS
- Framer Motion
- Radix UI
- Shadcn/ui
- TanStack Query
- React Router
- Lucide Icons
- Sonner (toasts)

**Backend:**
- Supabase (BaaS)
- PostgreSQL 16
- Edge Functions (Deno)
- Row Level Security
- Realtime subscriptions
- Storage buckets

**AI/ML:**
- Suno AI API v5
- Lovable AI Gateway
- Google Gemini 2.5
- OpenAI GPT-5
- Whisper (transcription)

**Platform:**
- Telegram Mini Apps SDK
- Telegram Bot API
- OAuth 2.0

</details>

---

## 📚 API Reference

### Suno API v5

<details>
<summary><b>POST /api/generate</b> - Простая генерация</summary>

```typescript
interface GenerateRequest {
  prompt: string;              // Max 5000 chars
  mv?: string;                 // Default: "chirp-crow"
  make_instrumental?: boolean; // Default: false
  wait_audio?: boolean;        // Default: false
}

// Example
const response = await fetch('https://api.sunoapi.org/api/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUNO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "Upbeat electronic dance music",
    mv: "chirp-crow"
  })
});
```

</details>

<details>
<summary><b>POST /api/custom_generate</b> - Расширенная генерация</summary>

```typescript
interface CustomGenerateRequest {
  title: string;               // Max 100 chars
  prompt: string;              // Lyrics, max 5000 chars
  style: string;               // Meta tags, max 1000 chars
  instrumental?: boolean;      // Default: false
  mv?: string;                 // Default: "chirp-crow"
}

// Example
const response = await fetch('https://api.sunoapi.org/api/custom_generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUNO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Cosmic Journey",
    prompt: "[Verse]\nWalking through stars\n[Chorus]\nCosmic high",
    style: "[Genre: Ambient] [Mood: Dreamy] [Instrument: Synth]",
    mv: "chirp-crow"
  })
});
```

</details>

<details>
<summary><b>POST /api/generate_lyrics</b> - Генерация лирики</summary>

```typescript
interface GenerateLyricsRequest {
  prompt: string; // Topic description
}

const response = await fetch('https://api.sunoapi.org/api/generate_lyrics', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUNO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "A love song about autumn"
  })
});

// Response
{
  "code": "success",
  "data": {
    "id": "lyrics-uuid",
    "text": "[Verse]\nFalling leaves...",
    "title": "Autumn Love"
  }
}
```

</details>

<details>
<summary><b>GET /api/get</b> - Получить результаты</summary>

```typescript
// Получить все треки
const response = await fetch('https://api.sunoapi.org/api/get', {
  headers: {
    'Authorization': `Bearer ${SUNO_API_KEY}`
  }
});

// Получить конкретные треки
const response = await fetch(
  'https://api.sunoapi.org/api/get?ids=id1,id2',
  {
    headers: {
      'Authorization': `Bearer ${SUNO_API_KEY}`
    }
  }
);

// Response
{
  "code": "success",
  "data": [{
    "id": "song-uuid",
    "title": "Song Title",
    "status": "SUCCESS",
    "audio_url": "https://...",
    "image_url": "https://...",
    "model_name": "chirp-crow",
    "metadata": {
      "tags": ["[Genre: Pop]"],
      "duration": 180
    }
  }]
}
```

</details>

<details>
<summary><b>GET /api/get_limit</b> - Проверить квоту</summary>

```typescript
const response = await fetch('https://api.sunoapi.org/api/get_limit', {
  headers: {
    'Authorization': `Bearer ${SUNO_API_KEY}`
  }
});

// Response
{
  "code": "success",
  "data": {
    "credits_left": 50,
    "monthly_quota": 500,
    "daily_used": 10
  }
}
```

</details>

### Edge Functions

<details>
<summary><b>POST /functions/v1/suno-generate</b></summary>

```typescript
const { data, error } = await supabase.functions.invoke('suno-generate', {
  body: {
    action: 'generate',
    payload: {
      title: "Song Title",
      prompt: "[Verse]\nLyrics...",
      style: "[Genre: Pop] [Mood: Happy]",
      model: "chirp-crow"
    }
  }
});
```

</details>

<details>
<summary><b>POST /functions/v1/project-ai</b></summary>

```typescript
const { data, error } = await supabase.functions.invoke('project-ai', {
  body: {
    action: 'generateConcept',
    projectType: 'album',
    genre: 'Electronic',
    mood: 'Energetic',
    theme: 'Future city life'
  }
});
```

</details>

---

## 📖 Документация

### Основные документы

- 📘 **[TELEGRAM_MINI_APP_INTEGRATION.md](TELEGRAM_MINI_APP_INTEGRATION.md)** - Полное руководство по Telegram Mini App
- 📗 **[TELEGRAM_INTEGRATION.md](TELEGRAM_INTEGRATION.md)** - OAuth и авторизация
- 📙 **[SUNO_API.md](docs/SUNO_API.md)** - Документация Suno API
- 📕 **[DATABASE.md](docs/DATABASE.md)** - Структура базы данных
- 📔 **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Инструкции по деплою

### Примеры кода

```
docs/examples/
├── generate-simple.ts       # Простая генерация
├── generate-custom.ts       # Расширенная генерация
├── generate-with-tags.ts    # Использование meta tags
├── style-recommendations.ts # Рекомендации стилей
└── prompt-builder.ts        # Конструктор промптов
```

---

## 🚢 Deployment

### Lovable Platform (Рекомендуется)

```bash
# Push в main → автоматический деплой
git push origin main

# Доступ к приложению
https://your-project.lovable.app
```

### Самостоятельный деплой

```bash
# Build
npm run build

# Preview
npm run preview

# Deploy на любой статичный хостинг
# Vercel, Netlify, CloudFlare Pages, etc.
```

### Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

---

## 📸 Скриншоты

<div align="center">

### Главная страница
![Home](docs/images/home.png)

### Генерация музыки
![Generate](docs/images/generate.png)

### Библиотека
![Library](docs/images/library.png)

### Проекты
![Projects](docs/images/projects.png)

</div>

---

## 🤝 Contributing

Мы приветствуем вклад в проект! Пожалуйста, прочитайте [CONTRIBUTING.md](CONTRIBUTING.md) для деталей.

### Процесс разработки

```bash
# 1. Fork репозитория
# 2. Создайте feature branch
git checkout -b feature/amazing-feature

# 3. Commit изменений
git commit -m 'feat: add amazing feature'

# 4. Push в branch
git push origin feature/amazing-feature

# 5. Откройте Pull Request
```

---

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

---

## 🙏 Благодарности

- **[Suno AI](https://suno.com)** - AI музыкальная платформа
- **[Lovable](https://lovable.dev)** - Платформа разработки
- **[Supabase](https://supabase.com)** - Backend инфраструктура
- **[Telegram](https://telegram.org)** - Mini Apps платформа
- **[Shadcn/ui](https://ui.shadcn.com)** - UI компоненты

---

## 📞 Контакты

- **Telegram**: [@musicverse_bot](https://t.me/musicverse_bot)
- **Email**: support@musicverse.ai
- **Discord**: [Join our community](https://discord.gg/musicverse)

---

<div align="center">

**Сделано с ❤️ командой MusicVerse**

[![Star this repo](https://img.shields.io/github/stars/yourusername/musicverse?style=social)](https://github.com/yourusername/musicverse)
[![Follow on Twitter](https://img.shields.io/twitter/follow/musicverse?style=social)](https://twitter.com/musicverse)

</div>
