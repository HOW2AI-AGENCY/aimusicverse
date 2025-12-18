/**
 * Quick Actions keyboard - Fast access to common operations
 */

import { ButtonBuilder } from '../utils/button-builder.ts';
import { BOT_CONFIG } from '../config.ts';

export interface QuickPreset {
  id: string;
  name: string;
  emoji: string;
  style: string;
  description: string;
}

// Quick generation presets
export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'rock',
    name: 'Рок',
    emoji: '🎸',
    style: 'energetic rock with electric guitar, powerful drums',
    description: 'Энергичный рок с гитарой'
  },
  {
    id: 'pop',
    name: 'Поп',
    emoji: '🎹',
    style: 'catchy pop song, upbeat melody, modern production',
    description: 'Запоминающийся поп-хит'
  },
  {
    id: 'electronic',
    name: 'Электро',
    emoji: '🎧',
    style: 'electronic dance music, synthesizers, deep bass',
    description: 'Электронная танцевальная музыка'
  },
  {
    id: 'hiphop',
    name: 'Хип-хоп',
    emoji: '🎤',
    style: 'hip hop beat, trap drums, 808 bass',
    description: 'Современный хип-хоп бит'
  },
  {
    id: 'jazz',
    name: 'Джаз',
    emoji: '🎺',
    style: 'smooth jazz, saxophone, piano, laid back groove',
    description: 'Расслабляющий джаз'
  },
  {
    id: 'classical',
    name: 'Классика',
    emoji: '🎻',
    style: 'orchestral classical music, strings, emotional',
    description: 'Оркестровая классика'
  },
  {
    id: 'ambient',
    name: 'Эмбиент',
    emoji: '🌙',
    style: 'ambient atmospheric, peaceful, cinematic pads',
    description: 'Атмосферный эмбиент'
  },
  {
    id: 'lofi',
    name: 'Lo-Fi',
    emoji: '☕',
    style: 'lofi hip hop, chill beats, vinyl crackle, study music',
    description: 'Lo-Fi для учёбы и работы'
  }
];

export function createQuickActionsKeyboard() {
  const keyboard = new ButtonBuilder();
  
  // Quick presets row 1
  keyboard.addRow(
    {
      text: 'Рок',
      emoji: '🎸',
      action: { type: 'callback', data: 'quick_gen_rock' }
    },
    {
      text: 'Поп',
      emoji: '🎹',
      action: { type: 'callback', data: 'quick_gen_pop' }
    },
    {
      text: 'Электро',
      emoji: '🎧',
      action: { type: 'callback', data: 'quick_gen_electronic' }
    }
  );

  // Quick presets row 2
  keyboard.addRow(
    {
      text: 'Хип-хоп',
      emoji: '🎤',
      action: { type: 'callback', data: 'quick_gen_hiphop' }
    },
    {
      text: 'Джаз',
      emoji: '🎺',
      action: { type: 'callback', data: 'quick_gen_jazz' }
    },
    {
      text: 'Lo-Fi',
      emoji: '☕',
      action: { type: 'callback', data: 'quick_gen_lofi' }
    }
  );

  // Quick actions row
  keyboard.addRow(
    {
      text: 'Кавер',
      emoji: '🎤',
      action: { type: 'callback', data: 'start_cover' }
    },
    {
      text: 'Расширить',
      emoji: '➕',
      action: { type: 'callback', data: 'start_extend' }
    }
  );

  // Utility row
  keyboard.addRow(
    {
      text: 'Загрузить аудио',
      emoji: '📤',
      action: { type: 'callback', data: 'start_upload' }
    },
    {
      text: 'Статус',
      emoji: '⏳',
      action: { type: 'callback', data: 'check_status' }
    }
  );

  // Back button
  keyboard.addButton({
    text: 'Назад',
    emoji: '🔙',
    action: { type: 'callback', data: 'nav_main' }
  });

  return keyboard.build();
}

export function createQuickGenConfirmKeyboard(presetId: string) {
  const preset = QUICK_PRESETS.find(p => p.id === presetId);
  if (!preset) return null;

  return new ButtonBuilder()
    .addButton({
      text: 'Генерировать',
      emoji: '🎵',
      action: { type: 'callback', data: `confirm_quick_gen_${presetId}` }
    })
    .addButton({
      text: 'Изменить описание',
      emoji: '✏️',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate?style=${encodeURIComponent(preset.style)}` }
    })
    .addButton({
      text: 'Назад',
      emoji: '🔙',
      action: { type: 'callback', data: 'quick_actions' }
    })
    .build();
}

export function getPresetById(id: string): QuickPreset | undefined {
  return QUICK_PRESETS.find(p => p.id === id);
}
