/**
 * Genre-specific song templates for Suno AI
 * Each template follows best practices with proper tag usage
 */

export interface SunoTemplate {
  id: string;
  name: string;
  nameRu: string;
  genre: string;
  description: string;
  structure: string[];
  exampleLyrics: string;
  recommendedTags: string[];
  stylePrompt: string;
}

export const SUNO_TEMPLATES: SunoTemplate[] = [
  {
    id: 'pop-standard',
    name: 'Pop Standard',
    nameRu: 'Поп стандарт',
    genre: 'pop',
    description: 'Классическая поп-структура с интро, куплетами, пре-припевами, припевами и аутро',
    structure: ['Intro', 'Verse 1', 'Pre-Chorus', 'Chorus', 'Verse 2', 'Pre-Chorus', 'Chorus', 'Bridge', 'Chorus', 'Outro', 'End'],
    exampleLyrics: `[Intro] [Soft Piano]

[Verse 1] [Female Vocal] [Gentle]
Утро раскрасило небо в розовый цвет
Я просыпаюсь — тебя рядом нет
Но в сердце живёт твоя тёплая улыбка
Она согревает, как солнечный свет

[Pre-Chorus] [Build]
И я не боюсь этих серых дней
(ooh, ooh)
Когда помню свет твоих глазей

[Chorus] [Full Band] [Powerful]
Ты — моё небо, моя весна
(harmony)
Ты — моя самая яркая звезда
Без тебя ночь темна и холодна
Но ты всегда в моём сердце, навсегда
(ooh, aah)

[Verse 2] [Male Vocal] [Smooth]
Дни пролетают, как птицы вдаль
Но каждый закат приносит печаль
Ты где-то далеко, за облаками
Но наша любовь сильнее расстояний

[Pre-Chorus] [Build]
И я не боюсь этих серых дней
(ooh, ooh)
Когда помню свет твоих глазей

[Chorus] [Full Band] [Powerful] [Anthemic]
Ты — моё небо, моя весна
(harmony)
Ты — моя самая яркая звезда
Без тебя ночь темна и холодна
Но ты всегда в моём сердце, навсегда
(ooh, aah)

[Bridge] [Breakdown] [Piano Only] [Whisper]
Тишина между строчками писем
Говорит громче слов о любви
(echo: любви)

[Chorus] [Climax] [Full Band]
Ты — моё небо, моя весна
Ты — моя самая яркая ЗВЕЗДА!
(harmony)

[Outro] [Fade Out] [Soft]
(ooh, aah)
Навсегда...

[End]`,
    recommendedTags: ['Female Vocal', 'Build', 'Full Band', 'Anthemic', 'Fade Out'],
    stylePrompt: 'pop, emotional, catchy chorus, piano, synth, romantic, female vocals',
  },
  {
    id: 'hip-hop-drill',
    name: 'Hip-Hop / Drill',
    nameRu: 'Хип-хоп / Дрилл',
    genre: 'hip-hop',
    description: 'Агрессивный хип-хоп с тёмными битами и жёстким флоу',
    structure: ['Intro', 'Verse 1', 'Hook', 'Verse 2', 'Hook', 'Bridge', 'Hook', 'Outro', 'End'],
    exampleLyrics: `[Intro] [808 Bass] [Dark]
Yeah, yeah, yeah
Let's go

[Verse 1] [Male Rap] [Aggressive]
Улицы помнят каждый мой шаг
Каждый синяк — это просто мой знак
Я поднимался с самых низов
Теперь мой путь — это тысячи слов
Деньги в кармане, враги за спиной
Но я не боюсь, потому что я — СВОЙ

[Hook] [Powerful] [Anthemic]
Это мой город, мой район
(skrrt, skrrt)
Здесь каждый знает мой закон
Это мой город, моя земля
(yeah, yeah)
Корона на мне — и это не зря

[Verse 2] [Male Rap] [Flow]
Они хотели видеть меня на дне
Но я восстал, как феникс в огне
Мои рифмы — это пули в обойме
Каждая строчка попадает в цель
Не останавливай меня, брат
Потому что путь назад — это ад

[Hook] [Powerful] [Anthemic]
Это мой город, мой район
(skrrt, skrrt)
Здесь каждый знает мой закон

[Bridge] [Breakdown] [Soft]
Иногда ночью я смотрю в небо
И думаю о тех, кто верил...
(echo: верил)

[Hook] [Drop] [Explosive]
Это мой ГОРОД!
(skrrt, skrrt)
Мой РАЙОН!

[Outro] [808 Bass] [Fade Out]
Yeah... yeah...

[End]`,
    recommendedTags: ['808 Bass', 'Male Rap', 'Aggressive', 'Dark', 'Drop'],
    stylePrompt: 'drill, hip-hop, dark, aggressive, 808 bass, trap hi-hats, male rap',
  },
  {
    id: 'edm-festival',
    name: 'EDM Festival',
    nameRu: 'EDM Фестиваль',
    genre: 'edm',
    description: 'Энергичный EDM с мощными билд-апами и дропами',
    structure: ['Intro', 'Build', 'Drop', 'Breakdown', 'Verse', 'Build', 'Drop', 'Outro', 'End'],
    exampleLyrics: `[Intro] [Atmospheric] [Synth]

[Build] [!crescendo] [Building]
Сердце бьётся в такт с басами
(ooh, ooh)
Мы танцуем под звёздами
Руки в небо — мы живём!
Эту ночь мы не ЗАБУДЁМ!

[Drop] [Explosive] [Full Band]
(instrumental drop)

[Breakdown] [Soft] [Piano]
Когда музыка стихает
И толпа замирает
Мы чувствуем этот момент
Мы — едины, мы — легенда

[Verse] [Female Vocal] [Ethereal]
Огни мерцают в ночи
Как миллион светлячков
Мы теряемся в музыке
В океане нот и слов
(ooh, aah)

[Build] [!build_up] [Intense]
Руки в небо, выше, ВЫШЕ!
(yeah, yeah)
Сердце бьётся громче, ГРОМЧЕ!
(ooh)
3... 2... 1...

[Drop] [Explosive] [Synth Lead]
(instrumental drop)
(la-la-la)

[Outro] [Fade Out] [Atmospheric]
(ooh, aah)
Эта ночь навсегда...

[End]`,
    recommendedTags: ['Synth', 'Build', 'Drop', 'Explosive', 'Atmospheric'],
    stylePrompt: 'edm, festival, progressive house, synth, euphoric, big room, drop',
  },
  {
    id: 'ballad-emotional',
    name: 'Emotional Ballad',
    nameRu: 'Эмоциональная баллада',
    genre: 'ballad',
    description: 'Медленная лирическая баллада с глубоким эмоциональным содержанием',
    structure: ['Intro', 'Verse 1', 'Verse 2', 'Chorus', 'Verse 3', 'Chorus', 'Bridge', 'Chorus', 'Outro', 'End'],
    exampleLyrics: `[Intro] [Piano Only] [Soft]

[Verse 1] [Male Vocal] [Gentle] [Emotional]
Я помню тот день, когда ты ушла
Дождь за окном, пустые слова
Твой силуэт в дверном проёме
Последний взгляд — и всё, что помню

[Verse 2] [Male Vocal] [Breathy]
Теперь я брожу по пустым улицам
И каждый угол напоминает о тебе
Кафе, где мы пили кофе по утрам
Скамейка в парке — наша тайна

[Chorus] [Strings] [Emotional]
Если бы я мог вернуть те дни
(ooh)
Я бы сказал то, что не сказал
Если бы я мог увидеть твои глаза
(harmony)
Я бы просил — только не уходи

[Verse 3] [Female Vocal] [Whisper]
Я слышу твой голос в тишине ночи
Он зовёт меня, но я не могу дойти
Между нами — океаны и года
Но моя любовь — она всё ещё жива

[Chorus] [Full Band] [Powerful]
Если бы я мог вернуть те дни
(ooh)
Я бы сказал то, что не сказал
Если бы я мог увидеть твои глаза
(harmony)
Я бы просил — только не уходи

[Bridge] [Piano Only] [Whisper]
Прости меня...
(echo: прости)
За всё, что не случилось между нами

[Chorus] [Climax] [Strings]
Если бы я мог... вернуть... те дни...
(harmony)

[Outro] [Fade Out] [Piano]
Только не уходи...
(ooh, aah)

[End]`,
    recommendedTags: ['Piano', 'Strings', 'Emotional', 'Gentle', 'Whisper', 'Fade Out'],
    stylePrompt: 'ballad, emotional, piano, strings, slow, heartfelt, male and female vocals',
  },
  {
    id: 'rock-anthem',
    name: 'Rock Anthem',
    nameRu: 'Рок-гимн',
    genre: 'rock',
    description: 'Мощный рок с гитарными соло и стадионным звучанием',
    structure: ['Intro', 'Verse 1', 'Pre-Chorus', 'Chorus', 'Verse 2', 'Pre-Chorus', 'Chorus', 'Solo', 'Bridge', 'Chorus', 'Outro', 'End'],
    exampleLyrics: `[Intro] [Electric Guitar] [Powerful]
(guitar riff)

[Verse 1] [Male Vocal] [Raspy]
Мы стоим на краю обрыва
Ветер в лицо, но мы не сдаёмся
Судьба бросает нам вызовы
Но мы всегда поднимаемся!

[Pre-Chorus] [Build] [Drums]
Пусть говорят, что мы безумны
(yeah!)
Пусть смеются нам вслед
(come on!)

[Chorus] [Full Band] [Anthemic]
Мы — рок-н-ролл, мы никогда не сдаёмся!
(hey! hey!)
Мы — огонь, что горит в темноте!
Руки вверх, если ты с нами!
(hey! hey!)
Мы — легенда, мы — навсегда!

[Verse 2] [Male Vocal] [Powerful]
Годы летят, но мы не стареем
Каждый концерт — как первый раз
Толпа кричит, огни мерцают
И музыка ведёт нас

[Pre-Chorus] [Build] [Intense]
Пусть говорят, что мы безумны
(yeah!)
Мы знаем — это наш путь!

[Chorus] [Full Band] [Anthemic] [Explosive]
Мы — рок-н-ролл, мы никогда не сдаёмся!
(hey! hey!)
Мы — огонь, что горит в темноте!

[Guitar Solo] [Electric Guitar]
(guitar solo)

[Bridge] [Breakdown] [Soft]
Когда всё закончится...
Когда свет погаснет...
Помни нас...
(echo: помни)

[Chorus] [Climax] [Full Band]
МЫ — РОК-Н-РОЛЛ!
(hey! hey!)
НАВСЕГДА!

[Outro] [Electric Guitar] [Fade Out]
(guitar riff)

[End]`,
    recommendedTags: ['Electric Guitar', 'Full Band', 'Anthemic', 'Raspy', 'Guitar Solo'],
    stylePrompt: 'rock, stadium rock, anthem, electric guitar, powerful drums, male vocals, guitar solo',
  },
  {
    id: 'indie-folk',
    name: 'Indie Folk',
    nameRu: 'Инди-фолк',
    genre: 'indie',
    description: 'Атмосферный инди-фолк с акустическими инструментами',
    structure: ['Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Chorus', 'Outro', 'End'],
    exampleLyrics: `[Intro] [Acoustic Guitar] [fingerpicked guitar]

[Verse 1] [Male Vocal] [Breathy] [Gentle]
По тропинкам старого леса
Я иду, куда глаза глядят
Листья шепчут мне свои секреты
О тех временах, что не вернуть назад

[Chorus] [Acoustic Guitar] [Harmonies]
И я ищу свой дом
(ooh, ooh)
Где-то за холмами
Где солнце согревает
И нет прощаний

[Verse 2] [Male Vocal] [Warm]
Старый дуб стоит на перекрёстке
Сколько путников он повидал
Я присяду здесь на минутку
Отдохну, пока закат не стал

[Chorus] [Acoustic Guitar] [Choir]
И я ищу свой дом
(harmony)
Где-то за холмами
Где солнце согревает
(la-la-la)
И нет прощаний

[Bridge] [Violin] [Atmospheric]
Дороги сплетаются в узоры
Как нити в руках судьбы
(ooh)
Я верю, что найду свой берег
Где сбудутся все мечты

[Chorus] [Full Band] [Emotional]
И я ищу свой дом
(ooh, ooh)
Где-то за холмами...
(harmony)

[Outro] [Acoustic Guitar] [Fade Out]
(fingerpicked guitar)
Где нет прощаний...

[End]`,
    recommendedTags: ['Acoustic Guitar', 'fingerpicked guitar', 'Breathy', 'Violin', 'Warm'],
    stylePrompt: 'indie folk, acoustic, warm, intimate, fingerpicked guitar, male vocals, atmospheric',
  },
];

/**
 * Get template by genre
 */
export function getTemplatesByGenre(genre: string): SunoTemplate[] {
  return SUNO_TEMPLATES.filter(t => t.genre.toLowerCase() === genre.toLowerCase());
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): SunoTemplate | undefined {
  return SUNO_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all genre options
 */
export function getAvailableGenres(): string[] {
  return [...new Set(SUNO_TEMPLATES.map(t => t.genre))];
}
