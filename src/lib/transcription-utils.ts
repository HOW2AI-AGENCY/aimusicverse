/**
 * Transcription Utilities
 * 
 * Intelligent model and format selection based on stem type for Klang.io transcription.
 * Optimizes requests by only requesting relevant formats for each stem type.
 */

export type KlangioModel = 'guitar' | 'piano' | 'drums' | 'vocal' | 'bass' | 'universal' | 'lead' | 'multi' | 'wind' | 'string' | 'piano_arrangement';
export type TranscriptionOutput = 'midi' | 'midi_quant' | 'mxml' | 'gp5' | 'pdf' | 'json';

export interface TranscriptionConfig {
  model: KlangioModel;
  outputs: TranscriptionOutput[];
  supportsTableture: boolean;
  description: string;
  formatDescriptions: {
    midi: boolean;
    midiQuant: boolean;
    pdf: boolean;
    gp5: boolean;
    mxml: boolean;
  };
}

/**
 * Get optimal transcription configuration based on stem type
 */
export function getTranscriptionConfig(stemType: string): TranscriptionConfig {
  const type = stemType.toLowerCase();
  
  // Guitar - full support including tablature
  if (type.includes('guitar')) {
    return {
      model: 'guitar',
      outputs: ['midi', 'midi_quant', 'gp5', 'pdf', 'mxml'],
      supportsTableture: true,
      description: 'Гитара с табулатурой',
      formatDescriptions: { midi: true, midiQuant: true, pdf: true, gp5: true, mxml: true }
    };
  }
  
  // Bass - tablature support
  if (type.includes('bass')) {
    return {
      model: 'bass',
      outputs: ['midi', 'midi_quant', 'gp5', 'mxml'],
      supportsTableture: true,
      description: 'Бас с табулатурой',
      formatDescriptions: { midi: true, midiQuant: true, pdf: false, gp5: true, mxml: true }
    };
  }
  
  // Drums - no tablature, no GP5
  if (type.includes('drum')) {
    return {
      model: 'drums',
      outputs: ['midi', 'midi_quant', 'pdf'],
      supportsTableture: false,
      description: 'Ударные ноты',
      formatDescriptions: { midi: true, midiQuant: true, pdf: true, gp5: false, mxml: false }
    };
  }
  
  // Piano/Keys - full notation, no tabs
  if (type.includes('piano') || type.includes('keys')) {
    return {
      model: 'piano',
      outputs: ['midi', 'midi_quant', 'pdf', 'mxml'],
      supportsTableture: false,
      description: 'Фортепианные ноты',
      formatDescriptions: { midi: true, midiQuant: true, pdf: true, gp5: false, mxml: true }
    };
  }
  
  // Vocals - melody transcription
  if (type.includes('vocal')) {
    return {
      model: 'vocal',
      outputs: ['midi', 'pdf', 'mxml'],
      supportsTableture: false,
      description: 'Вокальная мелодия',
      formatDescriptions: { midi: true, midiQuant: false, pdf: true, gp5: false, mxml: true }
    };
  }
  
  // Strings - universal with notation
  if (type.includes('string')) {
    return {
      model: 'string',
      outputs: ['midi', 'midi_quant', 'pdf', 'mxml'],
      supportsTableture: false,
      description: 'Струнные ноты',
      formatDescriptions: { midi: true, midiQuant: true, pdf: true, gp5: false, mxml: true }
    };
  }
  
  // Wind instruments
  if (type.includes('wind') || type.includes('brass') || type.includes('sax') || type.includes('flute')) {
    return {
      model: 'wind',
      outputs: ['midi', 'midi_quant', 'pdf', 'mxml'],
      supportsTableture: false,
      description: 'Духовые ноты',
      formatDescriptions: { midi: true, midiQuant: true, pdf: true, gp5: false, mxml: true }
    };
  }
  
  // Instrumental mix - use multi model
  if (type.includes('instrumental') || type.includes('other')) {
    return {
      model: 'multi',
      outputs: ['midi', 'midi_quant', 'mxml'],
      supportsTableture: false,
      description: 'Полифоническая транскрипция',
      formatDescriptions: { midi: true, midiQuant: true, pdf: false, gp5: false, mxml: true }
    };
  }
  
  // Default - universal model
  return {
    model: 'universal',
    outputs: ['midi', 'midi_quant', 'mxml'],
    supportsTableture: false,
    description: 'Универсальная транскрипция',
    formatDescriptions: { midi: true, midiQuant: true, pdf: false, gp5: false, mxml: true }
  };
}

/**
 * Get human-readable format name
 */
export function getFormatLabel(format: TranscriptionOutput): string {
  switch (format) {
    case 'midi': return 'MIDI';
    case 'midi_quant': return 'MIDI (Quant)';
    case 'mxml': return 'MusicXML';
    case 'gp5': return 'Guitar Pro';
    case 'pdf': return 'PDF Ноты';
    default: return format;
  }
}

/**
 * Get format description for UI
 */
export function getFormatDescription(format: TranscriptionOutput): string {
  switch (format) {
    case 'midi': return 'Стандартный MIDI файл';
    case 'midi_quant': return 'Квантизированный MIDI';
    case 'mxml': return 'Для нотных редакторов';
    case 'gp5': return 'Табулатура + ноты';
    case 'pdf': return 'Нотный лист';
    default: return '';
  }
}

/**
 * Check if stem type supports tablature output
 */
export function stemSupportsTableture(stemType: string): boolean {
  const type = stemType.toLowerCase();
  return type.includes('guitar') || type.includes('bass');
}

/**
 * Get model display info
 */
export const MODEL_INFO: Record<KlangioModel, { name: string; icon: string; description: string }> = {
  'guitar': { name: 'Гитара', icon: '🎸', description: 'Для гитарных партий с табулатурой' },
  'piano': { name: 'Пианино', icon: '🎹', description: 'Для клавишных инструментов' },
  'drums': { name: 'Барабаны', icon: '🥁', description: 'Для ударных и перкуссии' },
  'vocal': { name: 'Вокал', icon: '🎤', description: 'Для вокальных мелодий' },
  'bass': { name: 'Бас', icon: '🎸', description: 'Для басовых линий с табулатурой' },
  'lead': { name: 'Соло', icon: '🎵', description: 'Для солирующих инструментов' },
  'string': { name: 'Струнные', icon: '🎻', description: 'Для скрипки, виолончели и др.' },
  'wind': { name: 'Духовые', icon: '🎷', description: 'Для саксофона, флейты и др.' },
  'multi': { name: 'Полифония', icon: '🎶', description: 'Для комбинированных дорожек' },
  'universal': { name: 'Универсальный', icon: '🎼', description: 'Для любых инструментов' },
  'piano_arrangement': { name: 'Аранжировка', icon: '🎹', description: 'Полная партитура для фортепиано' },
};
