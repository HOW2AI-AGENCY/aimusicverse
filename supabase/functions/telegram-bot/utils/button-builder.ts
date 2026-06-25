/**
 * Advanced Button Builder for Telegram Inline Keyboards
 * Provides flexible button creation with presets and layouts
 */

import type { InlineKeyboardButton } from "../telegram-api.ts";
import { BOT_CONFIG } from "../config.ts";

// ============================================================================
// Types
// ============================================================================

export type ButtonAction =
  | { type: "callback"; data: string }
  | { type: "url"; url: string }
  | { type: "webapp"; url: string }
  | { type: "switch_inline"; query: string }
  | { type: "switch_inline_current"; query: string };

export interface ButtonConfig {
  text: string;
  emoji?: string;
  action: ButtonAction;
}

export interface ButtonLayout {
  rows: ButtonConfig[][];
}

export type ButtonPreset =
  | "navigation"
  | "media_player"
  | "track_actions"
  | "pagination"
  | "confirmation"
  | "settings"
  | "share"
  | "back_home";

// ============================================================================
// Core Button Builder
// ============================================================================

export class ButtonBuilder {
  private rows: InlineKeyboardButton[][] = [];

  /**
   * Add a single button
   */
  addButton(config: ButtonConfig): this {
    const button = this.createButton(config);
    this.rows.push([button]);
    return this;
  }

  /**
   * Add multiple buttons in a row
   */
  addRow(...configs: ButtonConfig[]): this {
    const buttons = configs.map((config) => this.createButton(config));
    this.rows.push(buttons);
    return this;
  }

  /**
   * Add buttons with automatic layout (max 2 per row)
   */
  addButtons(configs: ButtonConfig[], maxPerRow: number = 2): this {
    for (let i = 0; i < configs.length; i += maxPerRow) {
      const rowConfigs = configs.slice(i, i + maxPerRow);
      const buttons = rowConfigs.map((config) => this.createButton(config));
      this.rows.push(buttons);
    }
    return this;
  }

  /**
   * Add a preset button group
   */
  addPreset(preset: ButtonPreset, context?: Record<string, any>): this {
    const presetRows = this.getPresetButtons(preset, context);
    this.rows.push(...presetRows);
    return this;
  }

  /**
   * Add a divider (empty row for visual separation)
   */
  addDivider(): this {
    // Actually, Telegram doesn't support empty rows, so we skip this
    return this;
  }

  /**
   * Build the final keyboard
   */
  build(): { inline_keyboard: InlineKeyboardButton[][] } {
    return { inline_keyboard: this.rows };
  }

  /**
   * Create a button from config
   */
  private createButton(config: ButtonConfig): InlineKeyboardButton {
    const text = config.emoji ? `${config.emoji} ${config.text}` : config.text;
    const button: InlineKeyboardButton = { text };

    switch (config.action.type) {
      case "callback":
        button.callback_data = config.action.data;
        break;
      case "url":
        button.url = config.action.url;
        break;
      case "webapp":
        button.web_app = { url: config.action.url };
        break;
      case "switch_inline":
        button.switch_inline_query = config.action.query;
        break;
      case "switch_inline_current":
        button.switch_inline_query_current_chat = config.action.query;
        break;
    }

    return button;
  }

  /**
   * Get preset button configurations
   */
  private getPresetButtons(preset: ButtonPreset, context?: Record<string, any>): InlineKeyboardButton[][] {
    switch (preset) {
      case "navigation":
        return this.getNavigationButtons();
      case "media_player":
        return this.getMediaPlayerButtons(context);
      case "track_actions":
        return this.getTrackActionButtons(context?.trackId);
      case "pagination":
        return this.getPaginationButtons(context);
      case "confirmation":
        return this.getConfirmationButtons(context);
      case "settings":
        return this.getSettingsButtons();
      case "share":
        return this.getShareButtons(context?.trackId);
      case "back_home":
        return this.getBackHomeButtons();
      default:
        return [];
    }
  }

  // ============================================================================
  // Preset Button Generators
  // ============================================================================

  private getNavigationButtons(): InlineKeyboardButton[][] {
    return [
      [
        { text: "🎼 Генератор", callback_data: "nav_generate" },
        { text: "📚 Библиотека", callback_data: "nav_library" },
      ],
      [
        { text: "🔬 Анализ", callback_data: "nav_analyze" },
        { text: "📁 Проекты", callback_data: "nav_projects" },
      ],
      [
        { text: "⚙️ Настройки", callback_data: "nav_settings" },
        { text: "ℹ️ Помощь", callback_data: "nav_help" },
      ],
    ];
  }

  private getMediaPlayerButtons(context?: Record<string, any>): InlineKeyboardButton[][] {
    const trackId = context?.trackId || "";
    const page = context?.page || 0;
    const total = context?.total || 1;

    const prevPage = page > 0 ? page - 1 : total - 1;
    const nextPage = page < total - 1 ? page + 1 : 0;

    // "Слушать" button opens Mini App with track deep link for proper playback
    const listenUrl = `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}`;

    return [
      [
        { text: "⏮️ Пред", callback_data: `lib_page_${prevPage}` },
        { text: "▶️ Слушать", web_app: { url: listenUrl } },
        { text: "⏭️ След", callback_data: `lib_page_${nextPage}` },
      ],
      [
        { text: "❤️ Нравится", callback_data: `like_${trackId}` },
        { text: "⬇️ Скачать", callback_data: `dl_${trackId}` },
      ],
    ];
  }

  private getTrackActionButtons(trackId?: string): InlineKeyboardButton[][] {
    if (!trackId) return [];

    return [
      [
        { text: "▶️ Слушать", callback_data: `play_${trackId}` },
        { text: "⬇️ Скачать", callback_data: `dl_${trackId}` },
      ],
      [
        { text: "📤 Поделиться", callback_data: `share_${trackId}` },
        { text: "❤️ В избранное", callback_data: `like_${trackId}` },
      ],
      [
        { text: "🎛️ Стемы", callback_data: `stems_${trackId}` },
        { text: "📊 Статистика", callback_data: `stats_${trackId}` },
      ],
      [
        { text: "🔄 Ремикс", callback_data: `remix_${trackId}` },
        { text: "📝 Тексты", callback_data: `lyrics_${trackId}` },
      ],
    ];
  }

  private getPaginationButtons(context?: Record<string, any>): InlineKeyboardButton[][] {
    const page = context?.page || 0;
    const total = context?.total || 1;
    const prefix = context?.prefix || "page";

    if (total <= 1) return [];

    const buttons: InlineKeyboardButton[] = [];

    // Previous button
    if (page > 0) {
      buttons.push({
        text: "⬅️ Назад",
        callback_data: `${prefix}_${page - 1}`,
      });
    }

    // Page indicator
    buttons.push({
      text: `${page + 1} / ${total}`,
      callback_data: "noop",
    });

    // Next button
    if (page < total - 1) {
      buttons.push({
        text: "Вперёд ➡️",
        callback_data: `${prefix}_${page + 1}`,
      });
    }

    return [buttons];
  }

  private getConfirmationButtons(context?: Record<string, any>): InlineKeyboardButton[][] {
    const confirmData = context?.confirmData || "confirm";
    const cancelData = context?.cancelData || "cancel";
    const confirmText = context?.confirmText || "Подтвердить";
    const cancelText = context?.cancelText || "Отменить";

    return [
      [
        { text: `✅ ${confirmText}`, callback_data: confirmData },
        { text: `❌ ${cancelText}`, callback_data: cancelData },
      ],
    ];
  }

  private getSettingsButtons(): InlineKeyboardButton[][] {
    return [
      [
        { text: "🔔 Уведомления", callback_data: "settings_notifications" },
        { text: "🎨 Оформление", callback_data: "settings_theme" },
      ],
      [
        { text: "🌐 Язык", callback_data: "settings_language" },
        { text: "🔒 Приватность", callback_data: "settings_privacy" },
      ],
      [
        { text: "📊 Статистика", callback_data: "settings_stats" },
        { text: "❓ Помощь", callback_data: "settings_help" },
      ],
    ];
  }

  private getShareButtons(trackId?: string): InlineKeyboardButton[][] {
    if (!trackId) return [];

    return [
      [{ text: "💬 Отправить в чат", callback_data: `share_chat_${trackId}` }],
      [{ text: "👥 Поделиться", switch_inline_query: `track_${trackId}` }],
      [{ text: "🔗 Копировать ссылку", callback_data: `share_link_${trackId}` }],
      [{ text: "📱 Поделиться в историю", callback_data: `share_story_${trackId}` }],
    ];
  }

  private getBackHomeButtons(): InlineKeyboardButton[][] {
    return [[{ text: "🏠 Главное меню", callback_data: "nav_main" }]];
  }
}

// ============================================================================
// Quick Builder Functions
// ============================================================================

/**
 * Create a simple keyboard with one button per row
 */
export function quickButtons(...buttons: Array<{ text: string; data: string; emoji?: string }>): {
  inline_keyboard: InlineKeyboardButton[][];
} {
  const builder = new ButtonBuilder();
  buttons.forEach((btn) => {
    builder.addButton({
      text: btn.text,
      emoji: btn.emoji,
      action: { type: "callback", data: btn.data },
    });
  });
  return builder.build();
}

/**
 * Create a keyboard with buttons in rows
 */
export function buttonGrid(rows: Array<Array<{ text: string; data: string; emoji?: string }>>): {
  inline_keyboard: InlineKeyboardButton[][];
} {
  const builder = new ButtonBuilder();
  rows.forEach((row) => {
    const configs: ButtonConfig[] = row.map((btn) => ({
      text: btn.text,
      emoji: btn.emoji,
      action: { type: "callback", data: btn.data },
    }));
    builder.addRow(...configs);
  });
  return builder.build();
}

/**
 * Create navigation keyboard
 */
export function navigationKeyboard(): { inline_keyboard: InlineKeyboardButton[][] } {
  return new ButtonBuilder().addPreset("navigation").addPreset("back_home").build();
}

/**
 * Create track action keyboard
 */
export function trackActionKeyboard(
  trackId: string,
  options?: { withNavigation?: boolean },
): { inline_keyboard: InlineKeyboardButton[][] } {
  const builder = new ButtonBuilder().addPreset("track_actions", { trackId });

  if (options?.withNavigation) {
    builder.addPreset("back_home");
  }

  return builder.build();
}

/**
 * Create pagination keyboard
 */
export function paginationKeyboard(
  page: number,
  total: number,
  prefix: string = "page",
): { inline_keyboard: InlineKeyboardButton[][] } {
  return new ButtonBuilder().addPreset("pagination", { page, total, prefix }).addPreset("back_home").build();
}

/**
 * Create media player keyboard
 */
export function mediaPlayerKeyboard(
  trackId: string,
  page: number,
  total: number,
): { inline_keyboard: InlineKeyboardButton[][] } {
  return new ButtonBuilder()
    .addPreset("media_player", { trackId, page, total })
    .addRow(
      {
        text: "Поделиться",
        emoji: "📤",
        action: { type: "callback", data: `share_${trackId}` },
      },
      {
        text: "Детали",
        emoji: "ℹ️",
        action: { type: "callback", data: `track_${trackId}` },
      },
    )
    .addPreset("back_home")
    .build();
}

/**
 * Create confirmation keyboard
 */
export function confirmationKeyboard(
  confirmData: string,
  cancelData: string = "cancel",
  options?: { confirmText?: string; cancelText?: string },
): { inline_keyboard: InlineKeyboardButton[][] } {
  return new ButtonBuilder()
    .addPreset("confirmation", {
      confirmData,
      cancelData,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
    })
    .build();
}

/**
 * Create WebApp button
 */
export function webAppButton(
  text: string,
  path: string = "",
  emoji?: string,
): { inline_keyboard: InlineKeyboardButton[][] } {
  const url = path ? `${BOT_CONFIG.miniAppUrl}${path}` : BOT_CONFIG.miniAppUrl;

  return new ButtonBuilder()
    .addButton({
      text,
      emoji,
      action: { type: "webapp", url },
    })
    .build();
}

/**
 * Create URL button
 */
export function urlButton(text: string, url: string, emoji?: string): { inline_keyboard: InlineKeyboardButton[][] } {
  return new ButtonBuilder()
    .addButton({
      text,
      emoji,
      action: { type: "url", url },
    })
    .build();
}

/**
 * Create share button
 */
export function shareButton(trackId: string): { inline_keyboard: InlineKeyboardButton[][] } {
  return new ButtonBuilder().addPreset("share", { trackId }).addPreset("back_home").build();
}

/**
 * Merge multiple keyboards
 */
export function mergeKeyboards(...keyboards: Array<{ inline_keyboard: InlineKeyboardButton[][] }>): {
  inline_keyboard: InlineKeyboardButton[][];
} {
  const allRows: InlineKeyboardButton[][] = [];

  keyboards.forEach((keyboard) => {
    allRows.push(...keyboard.inline_keyboard);
  });

  return { inline_keyboard: allRows };
}

/**
 * Add back button to existing keyboard
 */
export function addBackButton(
  keyboard: { inline_keyboard: InlineKeyboardButton[][] },
  backData: string = "nav_main",
  backText: string = "Назад",
): { inline_keyboard: InlineKeyboardButton[][] } {
  return {
    inline_keyboard: [...keyboard.inline_keyboard, [{ text: `🔙 ${backText}`, callback_data: backData }]],
  };
}
