// Pre-made inspiration prompts for various genres
// Each prompt is detailed with emotions, music style, vocals, and meets prompt length requirements

export interface InspirationPrompt {
  id: string;
  genre: string;
  mood: string;
  description: string;
  style?: string;
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
  
  // Electronic / House
  {
    id: 'house-1',
    genre: 'House',
    mood: 'Энергичный',
    description: 'Энергичный deep house трек 124 BPM с пульсирующим басом и четким кик-барабаном four-on-the-floor. Воздушные синтезаторные пэды создают атмосферу летней ночи. Фильтрованные вокальные семплы, перкуссия с латинским флейвором. Идеально для танцпола на закате.',
    style: 'deep house, groovy bassline, atmospheric pads, filtered vocals, summer vibes, club music',
  },
  {
    id: 'techno-1',
    genre: 'Techno',
    mood: 'Темный',
    description: 'Мрачный индустриальный техно 130 BPM с агрессивными синтезаторными лидами и давящим басом. Металлические перкуссионные элементы, эхо и реверберация создают ощущение заброшенного завода. Нарастающее напряжение с резкими брейками.',
    style: 'dark techno, industrial, heavy kick, distorted synths, warehouse rave, hypnotic',
  },
  {
    id: 'edm-1',
    genre: 'EDM',
    mood: 'Эйфорический',
    description: 'Эпический progressive house трек с мощным билдапом и эйфоричным дропом. Широкие суперсо́у синтезаторы, вдохновляющие аккорды мажорной тональности. Эмоциональный пик на припеве с massive lead synth. Фестивальная энергетика и чувство единения.',
    style: 'progressive house, big room, euphoric drop, festival anthem, emotional buildup, supersaw',
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

  // R&B / Soul
  {
    id: 'rnb-1',
    genre: 'R&B',
    mood: 'Чувственный',
    description: 'Современный R&B трек с плавающим синкопированным ритмом и чувственным вокалом. Мягкий электронный бас, воздушные пэды и деликатная перкуссия. Интимная атмосфера ночного города. Вокал переливается между грудным и фальцетным регистрами.',
    style: 'contemporary R&B, smooth groove, sensual vocals, atmospheric, late night vibes',
  },
  {
    id: 'soul-1',
    genre: 'Soul',
    mood: 'Воодушевляющий',
    description: 'Классический соул трек с мощным госпел-вокалом и живыми инструментами. Теплое звучание органа Hammond, грувящий бас, tight drums. Воодушевляющий текст о преодолении трудностей и внутренней силе. Хор на припеве усиливает эмоциональный посыл.',
    style: 'soul, gospel vocals, hammond organ, live band, uplifting, powerful',
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
    id: 'indie-1',
    genre: 'Indie Rock',
    mood: 'Мечтательный',
    description: 'Атмосферный инди-рок с shimmering гитарами и reverb-эффектами. Мечтательный вокал поверх слоев текстур. Умеренный темп с драматичными динамическими переходами. Эстетика закатного побережья, юношеская меланхолия.',
    style: 'indie rock, dreamy guitars, reverb, atmospheric, shoegaze influenced, nostalgic',
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

  // Classical / Cinematic
  {
    id: 'cinematic-1',
    genre: 'Cinematic',
    mood: 'Эпический',
    description: 'Эпический оркестровый саундтрек с массивными струнными и духовыми секциями. Нарастающая динамика от тихого пиано к грандиозному tutti. Хор добавляет величественности. Идеально для кульминационной сцены фильма - победа героя.',
    style: 'epic orchestral, cinematic, strings, brass, choir, dramatic, film score',
  },
  {
    id: 'ambient-1',
    genre: 'Ambient',
    mood: 'Медитативный',
    description: 'Медитативный эмбиент с долгими развивающимися пэдами и полевыми записями природы. Минималистичные текстуры создают пространство для созерцания. Нежные колокольчики и далекие дроны. Музыка для глубокой релаксации и внутреннего покоя.',
    style: 'ambient, meditative, drones, nature sounds, minimalist, peaceful, healing',
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
    id: 'bossa-1',
    genre: 'Bossa Nova',
    mood: 'Романтичный',
    description: 'Элегантная босса-нова с нежными нейлоновыми гитарами и мягким португальским вокалом. Расслабленный синкопированный ритм, минималистичная перкуссия. Атмосфера пляжа Ипанемы на закате. Романтика и изысканность в каждой ноте.',
    style: 'bossa nova, acoustic guitar, brazilian, romantic, smooth, sophisticated',
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
    id: 'ethnic-1',
    genre: 'World Fusion',
    mood: 'Мистический',
    description: 'Атмосферный world music трек, объединяющий восточные и западные традиции. Ситар и табла встречаются с электронными битами. Мистические вокальные семплы на неизвестном языке. Путешествие по древним землям через звук.',
    style: 'world fusion, ethnic, sitar, tabla, electronic, mystical, spiritual journey',
  },

  // Metal / Heavy
  {
    id: 'metal-1',
    genre: 'Metal',
    mood: 'Агрессивный',
    description: 'Тяжелый металл трек с двойной бочкой и distorted гитарными риффами. Мощный growl вокал чередуется с мелодичными чистыми партиями. Технически сложные гитарные соло. Эпическая структура с драматическими переходами.',
    style: 'metal, double bass drums, heavy riffs, growl vocals, technical, epic',
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
    id: 'folk-1',
    genre: 'Folk',
    mood: 'Душевный',
    description: 'Нежный фолк-трек с fingerpicking гитарой и скрипкой. Поэтичный текст о природе и человеческих переживаниях. Интимный вокал будто шепчет историю у костра. Органичные звуки создают ощущение леса осенью.',
    style: 'folk, fingerpicking guitar, violin, poetic, intimate, acoustic, natural',
  },
];
