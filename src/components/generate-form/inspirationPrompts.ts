// Pre-made inspiration prompts for various genres
// Each prompt is detailed with emotions, music style, vocals, and meets prompt length requirements

export interface InspirationPrompt {
  id: string;
  genre: string;
  mood: string;
  description: string;
  style?: string;
  usageCount?: number;
}

export const INSPIRATION_PROMPTS: InspirationPrompt[] = [
  // Lo-Fi / Chill
  {
    id: 'lofi-1',
    genre: 'Lo-Fi',
    mood: 'Расслабляющий',
    description: 'Мягкий lo-fi хип-хоп бит с теплыми виниловыми потрескиваниями и нежными фортепианными аккордами. Медленный расслабляющий темп 75 BPM, приглушенные барабаны с характерным свингом. Атмосфера позднего вечера в уютной комнате, дождь за окном. Мечтательный, ностальгический вайб для учебы или работы.',
    style: 'lo-fi hip hop, chillhop, jazzy piano, vinyl crackle, mellow drums, ambient textures',
  },
  {
    id: 'lofi-2',
    genre: 'Lo-Fi',
    mood: 'Меланхоличный',
    description: 'Меланхоличный lo-fi трек с печальными аккордами электропиано Rhodes и медленным битом. Глубокий бас, шумные текстуры старой пленки. Эмоция одиночества и размышлений в 3 часа ночи. Минималистичная аранжировка с пространством для дыхания между нотами.',
    style: 'sad lo-fi, rhodes piano, ambient, minimal beat, tape noise, emotional',
  },
  {
    id: 'lofi-3',
    genre: 'Lo-Fi',
    mood: 'Теплый',
    description: 'Уютный lo-fi бит с семплами старого джаза и нежными ударными. Теплые аналоговые синтезаторы создают обволакивающую атмосферу. Звуки кофейни на фоне - чашки, разговоры. Идеальный саундтрек для воскресного утра с книгой.',
    style: 'cozy lo-fi, jazz samples, analog warmth, coffee shop ambience, relaxing',
  },
  
  // Electronic / House
  {
    id: 'house-1',
    genre: 'House',
    mood: 'Энергичный',
    description: 'Энергичный deep house трек 124 BPM с пульсирующим басом и четким кик-барабаном four-on-the-floor. Воздушные синтезаторные пэды создают атмосферу летней ночи. Фильтрованные вокальные семплы, перкуссия с латинским флейвором. Идеально для танцпола на закате.',
    style: 'deep house, groovy bassline, atmospheric pads, filtered vocals, summer vibes, club music',
  },
  {
    id: 'house-2',
    genre: 'House',
    mood: 'Солнечный',
    description: 'Позитивный tropical house с яркими мажорными аккордами и игривыми мелодиями маримбы. Легкий грув 118 BPM, воздушные drop-секции. Ощущение пляжной вечеринки и беззаботного лета. Pan flute и steel drums добавляют экзотики.',
    style: 'tropical house, marimba, uplifting, beach vibes, summer, pan flute',
  },
  {
    id: 'techno-1',
    genre: 'Techno',
    mood: 'Темный',
    description: 'Мрачный индустриальный техно 130 BPM с агрессивными синтезаторными лидами и давящим басом. Металлические перкуссионные элементы, эхо и реверберация создают ощущение заброшенного завода. Нарастающее напряжение с резкими брейками.',
    style: 'dark techno, industrial, heavy kick, distorted synths, warehouse rave, hypnotic',
  },
  {
    id: 'techno-2',
    genre: 'Techno',
    mood: 'Гипнотический',
    description: 'Минималистичный техно с повторяющимися паттернами и постепенной эволюцией звука. Глубокий грув 128 BPM затягивает в транс. Тонкие модуляции фильтров, космические эффекты. Музыка для долгих сетов в подземных клубах.',
    style: 'minimal techno, hypnotic, deep groove, filter modulation, underground',
  },
  {
    id: 'edm-1',
    genre: 'EDM',
    mood: 'Эйфорический',
    description: 'Эпический progressive house трек с мощным билдапом и эйфоричным дропом. Широкие суперсо́у синтезаторы, вдохновляющие аккорды мажорной тональности. Эмоциональный пик на припеве с massive lead synth. Фестивальная энергетика и чувство единения.',
    style: 'progressive house, big room, euphoric drop, festival anthem, emotional buildup, supersaw',
  },
  {
    id: 'edm-2',
    genre: 'Future Bass',
    mood: 'Мечтательный',
    description: 'Воздушный future bass с chopped вокальными семплами и мерцающими синтезаторами. Эмоциональные аккорды между мелодичными секциями и мощными дропами. Kawaii эстетика встречает epic sound design. 150 BPM энергии и надежды.',
    style: 'future bass, chopped vocals, emotional, kawaii bass, melodic drops',
  },
  {
    id: 'drum-bass-1',
    genre: 'Drum & Bass',
    mood: 'Интенсивный',
    description: 'Высокоэнергетичный drum and bass 174 BPM с разрывными брейками и глубоким reese басом. Напряженные синтетические текстуры и sci-fi звуки. Адреналиновый ритм для ночных гонок. Резкие переходы и неожиданные drop.',
    style: 'drum and bass, liquid dnb, reese bass, fast breaks, energetic, sci-fi',
  },

  // Pop
  {
    id: 'pop-1',
    genre: 'Pop',
    mood: 'Позитивный',
    description: 'Яркий современный поп-трек с запоминающимся хуком и энергичным припевом. Синтезаторы 80-х в сочетании с современной продакшн, пульсирующий бас. Текст о беззаботном лете, первой любви и бесконечных возможностях. Женский вокал, уверенный и игривый.',
    style: 'synth pop, catchy hook, summer hit, female vocals, 80s inspired, dance pop',
  },
  {
    id: 'pop-2',
    genre: 'Pop',
    mood: 'Романтичный',
    description: 'Нежная поп-баллада с искренним вокалом и минималистичной аранжировкой. Акустическая гитара и пиано создают интимную атмосферу. Текст о глубоких чувствах и уязвимости в любви. Постепенно нарастающая динамика к эмоциональному пику.',
    style: 'pop ballad, acoustic guitar, piano, emotional vocals, intimate, heartfelt',
  },
  {
    id: 'pop-3',
    genre: 'Pop',
    mood: 'Танцевальный',
    description: 'Заводной disco-pop в духе Dua Lipa с фанковыми гитарами и четким грувом. Блестящие синтезаторы и groovy бас-линия. Призыв на танцпол с позитивным посылом. Женский вокал полный уверенности и стиля.',
    style: 'disco pop, funky guitar, groovy bass, dance floor, confident female vocals',
  },
  {
    id: 'pop-4',
    genre: 'Indie Pop',
    mood: 'Свежий',
    description: 'Легкий indie pop с акустическими элементами и современной продакшн. Запоминающаяся мелодия, простая но эффективная. Вокал чистый и naturally, без лишней обработки. Текст о молодости и поиске себя.',
    style: 'indie pop, acoustic elements, fresh sound, organic, youthful',
  },

  // Hip-Hop / Rap
  {
    id: 'hiphop-1',
    genre: 'Hip-Hop',
    mood: 'Уверенный',
    description: 'Мощный trap бит 140 BPM с тяжелым 808 басом и aggressive hi-hats. Темный минорный лад, атмосферные синтезаторные текстуры. Энергия уверенности в себе и амбиций. Пространство для агрессивного флоу с акцентами на даунбитах.',
    style: 'trap, 808 bass, dark melody, aggressive hi-hats, hard hitting, street anthem',
  },
  {
    id: 'hiphop-2',
    genre: 'Hip-Hop',
    mood: 'Ностальгический',
    description: 'Олдскульный бум-бэп бит с семплом из соул-пластинки 70-х. Теплый, хрустящий звук с качающим грувом 90 BPM. Честные барабаны, сочный бас, scratching элементы. Вайб золотой эры хип-хопа, истории о районе и реальной жизни.',
    style: 'boom bap, soul sample, 90s hip hop, vinyl sound, golden era, storytelling',
  },
  {
    id: 'hiphop-3',
    genre: 'Hip-Hop',
    mood: 'Melodic',
    description: 'Мелодичный trap с эмоциональными piano-мелодиями и auto-tune вокалом. Атмосферные пэды создают пространство для introspective lyrics. Медленный бит с тяжелыми 808, текст о боли и росте. Современное звучание с Drake/Post Malone вайбом.',
    style: 'melodic trap, auto-tune, emotional piano, introspective, atmospheric',
  },
  {
    id: 'hiphop-4',
    genre: 'Drill',
    mood: 'Агрессивный',
    description: 'UK drill бит с характерным sliding 808 басом и минималистичными темными мелодиями. Быстрые hi-hat patterns, зловещие арпеджио. Холодная городская атмосфера, рассказы о улицах. 140 BPM чистого адреналина.',
    style: 'uk drill, sliding 808, dark minimal, aggressive, urban, street music',
  },

  // R&B / Soul
  {
    id: 'rnb-1',
    genre: 'R&B',
    mood: 'Чувственный',
    description: 'Современный R&B трек с плавающим синкопированным ритмом и чувственным вокалом. Мягкий электронный бас, воздушные пэды и деликатная перкуссия. Интимная атмосфера ночного города. Вокал переливается между грудным и фальцетным регистрами.',
    style: 'contemporary R&B, smooth groove, sensual vocals, atmospheric, late night vibes',
  },
  {
    id: 'rnb-2',
    genre: 'R&B',
    mood: 'Сладкий',
    description: 'Сладкий R&B в духе 90-х с плавными гармониями и теплым продакшн. Нежные синтезаторы, четкий бит и соулфул вокал. Текст о любви и преданности. Идеально для романтического вечера вдвоем.',
    style: '90s R&B, smooth harmonies, soulful, romantic, slow jam',
  },
  {
    id: 'soul-1',
    genre: 'Soul',
    mood: 'Воодушевляющий',
    description: 'Классический соул трек с мощным госпел-вокалом и живыми инструментами. Теплое звучание органа Hammond, грувящий бас, tight drums. Воодушевляющий текст о преодолении трудностей и внутренней силе. Хор на припеве усиливает эмоциональный посыл.',
    style: 'soul, gospel vocals, hammond organ, live band, uplifting, powerful',
  },
  {
    id: 'soul-2',
    genre: 'Neo-Soul',
    mood: 'Глубокий',
    description: 'Глубокий neo-soul с влияниями jazz и hip-hop. Расслабленный грув с живыми барабанами, Fender Rhodes создает мягкие аккорды. Поэтичный текст о самопознании. Вокал теплый и natural, с subtle runs.',
    style: 'neo-soul, jazz influenced, rhodes piano, conscious lyrics, organic',
  },

  // Rock
  {
    id: 'rock-1',
    genre: 'Rock',
    mood: 'Драйвовый',
    description: 'Мощный рок-трек с distortion гитарами и энергичным драммингом. Риффы в духе классического рока, но с современным продакшном. Кричащий соло на гитаре в бридже. Текст о свободе и бунтарском духе. Sing-along припев с гармониями.',
    style: 'rock, distorted guitars, powerful drums, guitar solo, anthem, rebellious',
  },
  {
    id: 'rock-2',
    genre: 'Alternative Rock',
    mood: 'Интенсивный',
    description: 'Альтернативный рок с динамичными переходами от тихих куплетов к громким припевам. Эмоциональный вокал на грани крика. Гитары между clean и distorted. Текст о внутренней борьбе и принятии себя.',
    style: 'alternative rock, dynamic, emotional vocals, soft-loud dynamics',
  },
  {
    id: 'indie-1',
    genre: 'Indie Rock',
    mood: 'Мечтательный',
    description: 'Атмосферный инди-рок с shimmering гитарами и reverb-эффектами. Мечтательный вокал поверх слоев текстур. Умеренный темп с драматичными динамическими переходами. Эстетика закатного побережья, юношеская меланхолия.',
    style: 'indie rock, dreamy guitars, reverb, atmospheric, shoegaze influenced, nostalgic',
  },
  {
    id: 'punk-1',
    genre: 'Punk Rock',
    mood: 'Бунтарский',
    description: 'Быстрый панк-рок с простыми но мощными power chords. Энергичные drums в быстром темпе. Короткий трек полный энергии и протеста. Вокал грубый и честный, без претензий на идеальность.',
    style: 'punk rock, fast tempo, power chords, raw vocals, energetic, short',
  },

  // Jazz
  {
    id: 'jazz-1',
    genre: 'Jazz',
    mood: 'Расслабленный',
    description: 'Расслабленный джазовый трек в стиле cool jazz с мягким контрабасом и щеточками на барабанах. Импровизационные фортепианные партии в среднем регистре. Саксофон ведет мелодию с характерными blue notes. Атмосфера джаз-клуба в Нью-Йорке 50-х.',
    style: 'cool jazz, piano trio, walking bass, brushes, saxophone, sophisticated',
  },
  {
    id: 'jazz-2',
    genre: 'Nu-Jazz',
    mood: 'Современный',
    description: 'Современный nu-jazz с электронными элементами и сломанными битами. Сплав акустических инструментов и синтезаторов. Экспериментальные гармонии и неожиданные повороты. Урбанистическое звучание для искушенного слушателя.',
    style: 'nu jazz, broken beat, electronic jazz, fusion, experimental, urban',
  },
  {
    id: 'jazz-3',
    genre: 'Smooth Jazz',
    mood: 'Элегантный',
    description: 'Элегантный smooth jazz с мягким саксофоном и groovy ритмом. Слайд-гитара добавляет warmth, клавишные создают пространство. Идеальная музыка для вечернего ужина или лаунж-бара.',
    style: 'smooth jazz, saxophone, slide guitar, elegant, lounge, evening',
  },

  // Classical / Cinematic
  {
    id: 'cinematic-1',
    genre: 'Cinematic',
    mood: 'Эпический',
    description: 'Эпический оркестровый саундтрек с массивными струнными и духовыми секциями. Нарастающая динамика от тихого пиано к грандиозному tutti. Хор добавляет величественности. Идеально для кульминационной сцены фильма - победа героя.',
    style: 'epic orchestral, cinematic, strings, brass, choir, dramatic, film score',
  },
  {
    id: 'cinematic-2',
    genre: 'Cinematic',
    mood: 'Напряженный',
    description: 'Напряженный саундтрек для триллера с пульсирующими низкими струнными и тревожными звуками. Тикающие часы в ритме, нарастающее ощущение опасности. Резкие stabs и whispered textures. Сердце бьется быстрее.',
    style: 'thriller soundtrack, tension, dark strings, suspense, heartbeat rhythm',
  },
  {
    id: 'cinematic-3',
    genre: 'Cinematic',
    mood: 'Эмоциональный',
    description: 'Трогательная оркестровая композиция с печальной скрипичной темой. Нежное пиано поддерживает мелодию. Эмоции потери и надежды переплетаются. Музыка для драматических моментов, что остаются в памяти.',
    style: 'emotional orchestral, violin solo, piano, sad, hopeful, touching',
  },
  {
    id: 'ambient-1',
    genre: 'Ambient',
    mood: 'Медитативный',
    description: 'Медитативный эмбиент с долгими развивающимися пэдами и полевыми записями природы. Минималистичные текстуры создают пространство для созерцания. Нежные колокольчики и далекие дроны. Музыка для глубокой релаксации и внутреннего покоя.',
    style: 'ambient, meditative, drones, nature sounds, minimalist, peaceful, healing',
  },
  {
    id: 'ambient-2',
    genre: 'Dark Ambient',
    mood: 'Мрачный',
    description: 'Темный атмосферный эмбиент с гнетущими дронами и industrial текстурами. Пугающие звуковые пейзажи заброшенных пространств. Идеально для horror игр или экспериментального кино. Чувство тревоги и неизвестности.',
    style: 'dark ambient, industrial, horror soundtrack, drones, eerie, unsettling',
  },

  // Latin
  {
    id: 'reggaeton-1',
    genre: 'Reggaeton',
    mood: 'Страстный',
    description: 'Горячий reggaeton трек с характерным dembow ритмом и латинской перкуссией. Заводной припев для танцпола, страстный испанский вокал. Современный продакшн с электронными элементами. Энергия летней ночи в Пуэрто-Рико.',
    style: 'reggaeton, dembow, latin, perreo, spanish vocals, club banger, tropical',
  },
  {
    id: 'reggaeton-2',
    genre: 'Latin Pop',
    mood: 'Романтичный',
    description: 'Романтичный latin pop с мягким reggaeton грувом и нежной гитарой. Испанский текст о любви под звездами. Мужской вокал страстный но нежный. Легкие тропические элементы добавляют тепла.',
    style: 'latin pop, romantic reggaeton, spanish vocals, acoustic guitar, tropical',
  },
  {
    id: 'bossa-1',
    genre: 'Bossa Nova',
    mood: 'Романтичный',
    description: 'Элегантная босса-нова с нежными нейлоновыми гитарами и мягким португальским вокалом. Расслабленный синкопированный ритм, минималистичная перкуссия. Атмосфера пляжа Ипанемы на закате. Романтика и изысканность в каждой ноте.',
    style: 'bossa nova, acoustic guitar, brazilian, romantic, smooth, sophisticated',
  },
  {
    id: 'salsa-1',
    genre: 'Salsa',
    mood: 'Зажигательный',
    description: 'Зажигательная сальса с живыми духовыми и пульсирующей конгой. Энергичное фортепиано ведет мелодию, бас-линия не отпускает. Вокальный call-and-response с хором. Невозможно устоять на месте!',
    style: 'salsa, brass section, congas, piano, energetic, dance, latin',
  },

  // World
  {
    id: 'afrobeat-1',
    genre: 'Afrobeats',
    mood: 'Праздничный',
    description: 'Заводной afrobeats трек с infectious ритмом и многослойной перкуссией. Яркие синтезаторные мелодии и запоминающийся hook. Африканские вокальные гармонии. Энергия праздника и радости жизни. Танцевальный грув не отпускает.',
    style: 'afrobeats, african percussion, dancehall influence, party music, joyful',
  },
  {
    id: 'afrobeat-2',
    genre: 'Afro House',
    mood: 'Глубокий',
    description: 'Глубокий afro house с органичной перкуссией и трайбл элементами. Hypnotic грув 120 BPM затягивает в танец. Вокальные chants добавляют духовности. Закат в Африке, единение с ритмом земли.',
    style: 'afro house, tribal, percussion, deep groove, spiritual, organic',
  },
  {
    id: 'ethnic-1',
    genre: 'World Fusion',
    mood: 'Мистический',
    description: 'Атмосферный world music трек, объединяющий восточные и западные традиции. Ситар и табла встречаются с электронными битами. Мистические вокальные семплы на неизвестном языке. Путешествие по древним землям через звук.',
    style: 'world fusion, ethnic, sitar, tabla, electronic, mystical, spiritual journey',
  },
  {
    id: 'ethnic-2',
    genre: 'Arabic',
    mood: 'Чарующий',
    description: 'Чарующая арабская музыка с звенящим oudом и darbouka ритмами. Восточные мелодические украшения и модальные гаммы. Атмосфера древнего базара и караванных путей. Экзотика и тепло песчаных дюн.',
    style: 'arabic music, oud, darbouka, middle eastern, exotic, desert vibes',
  },
  {
    id: 'celtic-1',
    genre: 'Celtic',
    mood: 'Вдохновляющий',
    description: 'Эпическая кельтская музыка с fiddle и tin whistle ведущими мелодию. Bodhrán drums создают driving ритм. Ощущение зеленых холмов Ирландии и древних легенд. Вдохновляет на приключения.',
    style: 'celtic, irish folk, fiddle, tin whistle, epic, adventure, traditional',
  },

  // Metal / Heavy
  {
    id: 'metal-1',
    genre: 'Metal',
    mood: 'Агрессивный',
    description: 'Тяжелый металл трек с двойной бочкой и distorted гитарными риффами. Мощный growl вокал чередуется с мелодичными чистыми партиями. Технически сложные гитарные соло. Эпическая структура с драматическими переходами.',
    style: 'metal, double bass drums, heavy riffs, growl vocals, technical, epic',
  },
  {
    id: 'metal-2',
    genre: 'Metalcore',
    mood: 'Интенсивный',
    description: 'Взрывной metalcore с breakdown секциями и screamo вокалом. Чередование aggressive и melodic частей. Modern продакшн с djent элементами. Текст о борьбе и выживании.',
    style: 'metalcore, breakdowns, screamo, djent, modern production, intense',
  },
  {
    id: 'metal-3',
    genre: 'Symphonic Metal',
    mood: 'Величественный',
    description: 'Величественный symphonic metal с оркестровыми аранжировками и оперным женским вокалом. Мощные гитары соседствуют с хором и струнными. Эпические темы битв и фэнтези. Nightwish meets power metal.',
    style: 'symphonic metal, orchestral, female opera vocals, epic, fantasy, powerful',
  },

  // Country / Folk
  {
    id: 'country-1',
    genre: 'Country',
    mood: 'Искренний',
    description: 'Искренний кантри трек с акустической гитарой, банджо и steel guitar. Рассказ о простых ценностях и жизни в маленьком городке. Теплый мужской вокал с легким southern акцентом. Запоминающийся припев-история.',
    style: 'country, acoustic guitar, banjo, steel guitar, storytelling, americana',
  },
  {
    id: 'country-2',
    genre: 'Country Pop',
    mood: 'Позитивный',
    description: 'Современный country pop с catchy мелодиями и mainstream продакшн. Позитивный текст о лете, друзьях и хороших временах. Женский вокал с легким twang. Идеально для радио и playlist.',
    style: 'country pop, modern country, catchy, female vocals, summer anthem',
  },
  {
    id: 'folk-1',
    genre: 'Folk',
    mood: 'Душевный',
    description: 'Нежный фолк-трек с fingerpicking гитарой и скрипкой. Поэтичный текст о природе и человеческих переживаниях. Интимный вокал будто шепчет историю у костра. Органичные звуки создают ощущение леса осенью.',
    style: 'folk, fingerpicking guitar, violin, poetic, intimate, acoustic, natural',
  },
  {
    id: 'folk-2',
    genre: 'Indie Folk',
    mood: 'Меланхоличный',
    description: 'Меланхоличный indie folk с layered вокальными гармониями и мягкими струнными. Акустическая гитара и banjo создают теплую текстуру. Текст о потере и памяти. Bon Iver meets Fleet Foxes.',
    style: 'indie folk, vocal harmonies, acoustic, banjo, melancholic, introspective',
  },

  // Electronic Subgenres
  {
    id: 'synthwave-1',
    genre: 'Synthwave',
    mood: 'Ретро',
    description: 'Ностальгический synthwave с ретро-синтезаторами 80-х и пульсирующими арпеджио. Неоновая эстетика и driving beat. Гитарные соло в духе hair metal. Саундтрек для ночной езды по неоновому городу.',
    style: 'synthwave, 80s synths, retro, neon, outrun, nostalgic, guitar solo',
  },
  {
    id: 'synthwave-2',
    genre: 'Darksynth',
    mood: 'Мрачный',
    description: 'Мрачный darksynth с aggressive синтезаторами и industrial элементами. Тяжелый бит и distorted текстуры. Атмосфера cyberpunk dystopia. John Carpenter meets industrial.',
    style: 'darksynth, industrial synths, heavy, cyberpunk, aggressive, dark',
  },
  {
    id: 'chillstep-1',
    genre: 'Chillstep',
    mood: 'Мечтательный',
    description: 'Мечтательный chillstep с воздушными вокальными семплами и глубоким wobble басом. Эмоциональные piano мелодии поверх dubstep грува. Атмосфера космического путешествия. 140 BPM медитации.',
    style: 'chillstep, emotional dubstep, ethereal vocals, deep bass, atmospheric',
  },
  {
    id: 'trance-1',
    genre: 'Trance',
    mood: 'Эйфорический',
    description: 'Классический uplifting trance с мощными pads и эмоциональными breakdown. 138 BPM энергии и надежды. Нарастающие buildup к explosive drop. Фестивальный anthem что поднимает руки вверх.',
    style: 'uplifting trance, emotional pads, euphoric, festival, 138 bpm',
  },
  {
    id: 'psytrance-1',
    genre: 'Psytrance',
    mood: 'Психоделический',
    description: 'Психоделический psytrance с twisted синтезаторными линиями и гипнотическим басом. Tribal перкуссия и alien звуки. 145 BPM трансового путешествия. Музыка для outdoor рейвов под звездами.',
    style: 'psytrance, psychedelic, twisted synths, tribal percussion, hypnotic',
  },

  // Special/Experimental
  {
    id: 'vaporwave-1',
    genre: 'Vaporwave',
    mood: 'Ностальгический',
    description: 'Мечтательный vaporwave с slowed-down семплами 80-х и статическими текстурами. Эхо торгового центра и ретро-коммерческая эстетика. Виртуальная ностальгия по эпохе, которой не было.',
    style: 'vaporwave, slowed samples, nostalgic, mall vibes, lo-fi, surreal',
  },
  {
    id: 'glitch-1',
    genre: 'Glitch',
    mood: 'Экспериментальный',
    description: 'Экспериментальный glitch с broken beats и digital artifacts. Деконструированные звуки создают новую форму красоты из хаоса. Неожиданные переходы и текстуры. Музыка для открытых умов.',
    style: 'glitch, experimental, broken beats, digital, deconstruction, avant-garde',
  },
  {
    id: 'downtempo-1',
    genre: 'Downtempo',
    mood: 'Расслабленный',
    description: 'Глубокий downtempo с organic текстурами и мягким грувом. World music элементы встречают electronic продакшн. Идеально для yoga, медитации или creative work. Bonobo meets Thievery Corporation.',
    style: 'downtempo, organic, world music, chill, creative, sophisticated',
  },
];

// Track usage counts in localStorage
export function getPromptUsageCount(promptId: string): number {
  try {
    const usage = localStorage.getItem('musicverse_prompt_usage');
    if (usage) {
      const data = JSON.parse(usage);
      return data[promptId] || 0;
    }
  } catch {
    // ignore
  }
  return 0;
}

export function incrementPromptUsage(promptId: string): void {
  try {
    const usage = localStorage.getItem('musicverse_prompt_usage') || '{}';
    const data = JSON.parse(usage);
    data[promptId] = (data[promptId] || 0) + 1;
    localStorage.setItem('musicverse_prompt_usage', JSON.stringify(data));
  } catch {
    // ignore
  }
}
