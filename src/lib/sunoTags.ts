/**
 * Comprehensive SUNO Music Generation Tags
 * Structured with Russian translations and hints
 * 
 * Tags are inserted in English inside square brackets []
 * Display names and hints are in Russian
 */

export interface SunoTag {
  /** English value for insertion */
  value: string;
  /** Russian display name */
  label: string;
  /** Hint/description in Russian */
  hint: string;
}

export interface TagCategory {
  /** Category ID */
  id: string;
  /** Russian category name */
  label: string;
  /** Category icon name (lucide) */
  icon: string;
  /** Tags in this category */
  tags: SunoTag[];
}

export const SUNO_TAG_CATEGORIES: TagCategory[] = [
  {
    id: 'genres',
    label: 'Жанры',
    icon: 'Music',
    tags: [
      { value: 'pop', label: 'Поп', hint: 'Популярная музыка с запоминающимися мелодиями' },
      { value: 'rock', label: 'Рок', hint: 'Электрогитары, мощный звук, драйв' },
      { value: 'hip-hop', label: 'Хип-хоп', hint: 'Рэп, биты, урбан-культура' },
      { value: 'r&b', label: 'R&B', hint: 'Ритм-н-блюз, соул, мелодичный вокал' },
      { value: 'electronic', label: 'Электроника', hint: 'Синтезаторы, электронные биты' },
      { value: 'edm', label: 'EDM', hint: 'Танцевальная электронная музыка' },
      { value: 'house', label: 'Хаус', hint: 'Клубная музыка с четким битом 4/4' },
      { value: 'techno', label: 'Техно', hint: 'Минималистичная электроника, синтезаторы' },
      { value: 'jazz', label: 'Джаз', hint: 'Импровизация, свинг, духовые инструменты' },
      { value: 'classical', label: 'Классика', hint: 'Оркестровая музыка, симфонии' },
      { value: 'folk', label: 'Фолк', hint: 'Народная музыка, акустические инструменты' },
      { value: 'country', label: 'Кантри', hint: 'Американская фолк-музыка, гитара, банджо' },
      { value: 'metal', label: 'Метал', hint: 'Тяжёлые гитары, агрессивный вокал' },
      { value: 'punk', label: 'Панк', hint: 'Энергичный, бунтарский рок' },
      { value: 'indie', label: 'Инди', hint: 'Независимая альтернативная музыка' },
      { value: 'soul', label: 'Соул', hint: 'Эмоциональный вокал, госпел-корни' },
      { value: 'reggae', label: 'Регги', hint: 'Ямайские ритмы, оффбит' },
      { value: 'latin', label: 'Латина', hint: 'Латиноамериканские ритмы' },
      { value: 'k-pop', label: 'K-Pop', hint: 'Корейская поп-музыка' },
      { value: 'anime', label: 'Аниме', hint: 'Японский стиль аниме-музыки' },
      { value: 'trap', label: 'Трэп', hint: 'Тяжёлые 808 басы, хай-хэты' },
      { value: 'drill', label: 'Дрилл', hint: 'Агрессивный рэп с тёмными битами' },
      { value: 'phonk', label: 'Фонк', hint: 'Ретро-сэмплы, мемфис-рэп влияние' },
      { value: 'dubstep', label: 'Дабстеп', hint: 'Тяжёлые басы, воблы' },
      { value: 'lo-fi', label: 'Лоу-фай', hint: 'Тёплый, ретро-звук с шумами' },
      { value: 'synthwave', label: 'Синтвейв', hint: 'Ретро 80-е, неон, синтезаторы' },
      { value: 'gospel', label: 'Госпел', hint: 'Религиозная музыка, хор' },
      { value: 'blues', label: 'Блюз', hint: 'Грустные мелодии, гитара, гармоника' },
      { value: 'funk', label: 'Фанк', hint: 'Грувовый бас, ритмичный' },
      { value: 'disco', label: 'Диско', hint: '70-е, танцевальная музыка' },
    ]
  },
  {
    id: 'moods',
    label: 'Настроение',
    icon: 'Heart',
    tags: [
      { value: 'happy', label: 'Радостный', hint: 'Позитивное, весёлое настроение' },
      { value: 'sad', label: 'Грустный', hint: 'Меланхоличное, печальное настроение' },
      { value: 'energetic', label: 'Энергичный', hint: 'Бодрый, активный, драйвовый' },
      { value: 'melancholic', label: 'Меланхоличный', hint: 'Задумчивый, ностальгический' },
      { value: 'romantic', label: 'Романтичный', hint: 'Любовное, нежное настроение' },
      { value: 'dark', label: 'Тёмный', hint: 'Мрачный, загадочный' },
      { value: 'uplifting', label: 'Воодушевляющий', hint: 'Вдохновляющий, поднимающий' },
      { value: 'aggressive', label: 'Агрессивный', hint: 'Злой, мощный, интенсивный' },
      { value: 'chill', label: 'Расслабленный', hint: 'Спокойный, лёгкий, чил' },
      { value: 'dreamy', label: 'Мечтательный', hint: 'Воздушный, атмосферный' },
      { value: 'epic', label: 'Эпичный', hint: 'Грандиозный, кинематографичный' },
      { value: 'nostalgic', label: 'Ностальгический', hint: 'Воспоминания, ретро-чувства' },
      { value: 'intense', label: 'Интенсивный', hint: 'Напряжённый, мощный' },
      { value: 'peaceful', label: 'Умиротворённый', hint: 'Тихий, спокойный' },
      { value: 'mysterious', label: 'Загадочный', hint: 'Таинственный, интригующий' },
      { value: 'playful', label: 'Игривый', hint: 'Легкомысленный, весёлый' },
      { value: 'emotional', label: 'Эмоциональный', hint: 'Глубокие чувства, трогательный' },
      { value: 'triumphant', label: 'Триумфальный', hint: 'Победный, торжественный' },
      { value: 'anthemic', label: 'Гимновый', hint: 'Стадионный, объединяющий' },
      { value: 'ethereal', label: 'Эфирный', hint: 'Неземной, воздушный' },
    ]
  },
  {
    id: 'vocals',
    label: 'Вокал',
    icon: 'Mic',
    tags: [
      { value: 'male vocals', label: 'Мужской вокал', hint: 'Мужской голос' },
      { value: 'female vocals', label: 'Женский вокал', hint: 'Женский голос' },
      { value: 'duet', label: 'Дуэт', hint: 'Два голоса вместе' },
      { value: 'choir', label: 'Хор', hint: 'Многоголосие, хоровое пение' },
      { value: 'alto', label: 'Альт', hint: 'Низкий женский голос' },
      { value: 'soprano', label: 'Сопрано', hint: 'Высокий женский голос' },
      { value: 'tenor', label: 'Тенор', hint: 'Высокий мужской голос' },
      { value: 'bass', label: 'Бас', hint: 'Низкий мужской голос' },
      { value: 'raspy', label: 'Хриплый', hint: 'Сиплый, хриплый тембр' },
      { value: 'smooth', label: 'Гладкий', hint: 'Мягкий, плавный вокал' },
      { value: 'breathy', label: 'Придыхательный', hint: 'С дыханием, интимный' },
      { value: 'powerful', label: 'Мощный', hint: 'Сильный, громкий голос' },
      { value: 'whisper', label: 'Шёпот', hint: 'Тихий, шёпотный вокал' },
      { value: 'falsetto', label: 'Фальцет', hint: 'Высокий, головной регистр' },
      { value: 'autotune', label: 'Автотюн', hint: 'Обработанный вокал, T-Pain эффект' },
      { value: 'rap', label: 'Рэп', hint: 'Речитатив, читка' },
      { value: 'spoken word', label: 'Речь', hint: 'Разговорный стиль' },
      { value: 'vocoder', label: 'Вокодер', hint: 'Роботизированный голос' },
      { value: 'harmonies', label: 'Гармонии', hint: 'Бэк-вокал, подпевки' },
      { value: 'ad-libs', label: 'Ад-либы', hint: 'Импровизации, восклицания' },
    ]
  },
  {
    id: 'instruments',
    label: 'Инструменты',
    icon: 'Guitar',
    tags: [
      { value: 'piano', label: 'Фортепиано', hint: 'Клавишный инструмент' },
      { value: 'acoustic guitar', label: 'Акустическая гитара', hint: 'Нейлон или сталь' },
      { value: 'electric guitar', label: 'Электрогитара', hint: 'Усиленная гитара' },
      { value: 'bass', label: 'Бас', hint: 'Бас-гитара, низкие частоты' },
      { value: 'drums', label: 'Барабаны', hint: 'Ударная установка' },
      { value: 'synth', label: 'Синтезатор', hint: 'Электронные клавиши' },
      { value: 'strings', label: 'Струнные', hint: 'Скрипки, виолончели, оркестр' },
      { value: 'brass', label: 'Духовые', hint: 'Труба, тромбон, саксофон' },
      { value: 'violin', label: 'Скрипка', hint: 'Классический струнный' },
      { value: 'cello', label: 'Виолончель', hint: 'Низкий струнный' },
      { value: 'flute', label: 'Флейта', hint: 'Деревянный духовой' },
      { value: 'saxophone', label: 'Саксофон', hint: 'Джазовый духовой' },
      { value: 'trumpet', label: 'Труба', hint: 'Медный духовой' },
      { value: 'organ', label: 'Орган', hint: 'Церковный или Hammond' },
      { value: 'harp', label: 'Арфа', hint: 'Классический струнный' },
      { value: 'percussion', label: 'Перкуссия', hint: 'Шейкеры, тамбурины, бонго' },
      { value: '808', label: '808', hint: 'TR-808 драм-машина, хип-хоп биты' },
      { value: 'ukulele', label: 'Укулеле', hint: 'Гавайская гитара' },
      { value: 'harmonica', label: 'Гармоника', hint: 'Губная гармошка' },
      { value: 'banjo', label: 'Банджо', hint: 'Кантри инструмент' },
    ]
  },
  {
    id: 'tempo',
    label: 'Темп',
    icon: 'Gauge',
    tags: [
      { value: 'slow', label: 'Медленный', hint: '60-80 BPM, баллада' },
      { value: 'moderate', label: 'Умеренный', hint: '80-110 BPM, средний темп' },
      { value: 'fast', label: 'Быстрый', hint: '120-140 BPM, энергичный' },
      { value: 'very fast', label: 'Очень быстрый', hint: '140+ BPM, драйв' },
      { value: 'upbeat', label: 'Бодрый', hint: 'Подвижный, танцевальный' },
      { value: 'downtempo', label: 'Даунтемпо', hint: 'Замедленный, расслабленный' },
      { value: 'ballad', label: 'Баллада', hint: 'Медленная лирическая песня' },
      { value: 'groovy', label: 'Грувовый', hint: 'С чётким ритмом, качающий' },
      { value: 'driving', label: 'Драйвовый', hint: 'Напористый, энергичный ритм' },
      { value: 'laid-back', label: 'Расслабленный', hint: 'Спокойный, ненапряжённый' },
    ]
  },
  {
    id: 'production',
    label: 'Продакшн',
    icon: 'Sliders',
    tags: [
      { value: 'full band', label: 'Полный состав', hint: 'Все инструменты, насыщенный звук' },
      { value: 'acoustic', label: 'Акустический', hint: 'Без электроники, живой звук' },
      { value: 'electronic', label: 'Электронный', hint: 'Синтезаторы, драм-машины' },
      { value: 'orchestral', label: 'Оркестровый', hint: 'Симфонический оркестр' },
      { value: 'minimal', label: 'Минимал', hint: 'Мало инструментов, простой' },
      { value: 'layered', label: 'Многослойный', hint: 'Много слоёв, плотный микс' },
      { value: 'lo-fi', label: 'Лоу-фай', hint: 'Винтажный звук, шумы' },
      { value: 'hi-fi', label: 'Хай-фай', hint: 'Чистый, качественный звук' },
      { value: 'live feel', label: 'Живое звучание', hint: 'Как концертная запись' },
      { value: 'polished', label: 'Отполированный', hint: 'Студийно обработанный' },
      { value: 'raw', label: 'Сырой', hint: 'Минимум обработки, честный' },
      { value: 'cinematic', label: 'Кинематографичный', hint: 'Как саундтрек к фильму' },
      { value: 'ambient', label: 'Эмбиент', hint: 'Атмосферный, фоновый' },
      { value: 'punchy', label: 'Пробивной', hint: 'Чёткий удар, атака' },
      { value: 'warm', label: 'Тёплый', hint: 'Аналоговое звучание' },
    ]
  },
  {
    id: 'sections',
    label: 'Секции',
    icon: 'LayoutList',
    tags: [
      { value: 'Intro', label: 'Интро', hint: 'Вступление песни' },
      { value: 'Verse', label: 'Куплет', hint: 'Основная часть с текстом' },
      { value: 'Pre-Chorus', label: 'Пре-припев', hint: 'Подводка к припеву' },
      { value: 'Chorus', label: 'Припев', hint: 'Главная часть, хук' },
      { value: 'Bridge', label: 'Бридж', hint: 'Контрастная часть' },
      { value: 'Outro', label: 'Аутро', hint: 'Завершение песни' },
      { value: 'Hook', label: 'Хук', hint: 'Запоминающийся момент' },
      { value: 'Drop', label: 'Дроп', hint: 'Кульминация в EDM' },
      { value: 'Build', label: 'Билд-ап', hint: 'Нарастание к дропу' },
      { value: 'Breakdown', label: 'Брейкдаун', hint: 'Замедление, минимал' },
      { value: 'Instrumental', label: 'Инструментал', hint: 'Без вокала' },
      { value: 'Solo', label: 'Соло', hint: 'Сольная партия инструмента' },
    ]
  },
  {
    id: 'effects',
    label: 'Эффекты',
    icon: 'Wand2',
    tags: [
      { value: 'reverb', label: 'Реверберация', hint: 'Эхо, пространство' },
      { value: 'delay', label: 'Дилей', hint: 'Задержка звука' },
      { value: 'distortion', label: 'Дисторшн', hint: 'Перегруз, грязный звук' },
      { value: 'clean', label: 'Чистый', hint: 'Без искажений' },
      { value: 'compressed', label: 'Компрессия', hint: 'Сжатый динамический диапазон' },
      { value: 'filtered', label: 'Фильтр', hint: 'Обрезанные частоты' },
      { value: 'phaser', label: 'Фейзер', hint: 'Космический эффект' },
      { value: 'chorus effect', label: 'Хорус', hint: 'Расширение звука' },
      { value: 'wah', label: 'Вау', hint: 'Quack эффект гитары' },
      { value: 'glitch', label: 'Глитч', hint: 'Цифровые артефакты' },
    ]
  },
];

/**
 * Get all tags as flat array
 */
export function getAllSunoTags(): SunoTag[] {
  return SUNO_TAG_CATEGORIES.flatMap(cat => cat.tags);
}

/**
 * Find tag by value
 */
export function findSunoTag(value: string): SunoTag | undefined {
  const lowerValue = value.toLowerCase();
  return getAllSunoTags().find(t => t.value.toLowerCase() === lowerValue);
}

/**
 * Format tag for insertion (English, in brackets)
 */
export function formatTagForInsertion(tag: string): string {
  // Remove any existing brackets
  const clean = tag.replace(/[\[\]]/g, '').trim();
  return `[${clean}]`;
}

/**
 * Parse tags from text (extract from square brackets)
 */
export function parseTagsFromText(text: string): string[] {
  const matches = text.match(/\[([^\]]+)\]/g) || [];
  return matches.map(m => m.slice(1, -1).trim()).filter(Boolean);
}

/**
 * Get Russian label for an English tag value
 */
export function getTagLabel(value: string): string {
  const tag = findSunoTag(value);
  return tag?.label || value;
}
