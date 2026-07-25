/**
 * Analysis action handlers for the /analyze command
 * Transcription, chord recognition, beat tracking, full analysis
 */

import { BOT_CONFIG } from "../config.ts";
import { editMessageText, answerCallbackQuery, escapeMarkdownV2 } from "../telegram-api.ts";
import { trackMetric } from "../utils/index.ts";
import { createLogger } from "../../_shared/logger.ts";
import { getAnalysisSession } from "./analyze-types.ts";

const logger = createLogger("telegram-analyze-cmd");

/**
 * Handle transcription model selection
 */
export async function handleTranscribeMenu(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string,
): Promise<void> {
  await editMessageText(
    chatId,
    messageId,
    `🎼 *Транскрипция*

Выберите модель для анализа:

🎸 *Guitar* \\- для гитарных партий
🎹 *Piano* \\- для фортепиано  
🎤 *Vocal* \\- для мелодии голоса
🎵 *Universal* \\- автоопределение`,
    {
      inline_keyboard: [
        [
          { text: "🎸 Guitar", callback_data: `analyze_tr_guitar_${referenceId.substring(0, 16)}` },
          { text: "🎹 Piano", callback_data: `analyze_tr_piano_${referenceId.substring(0, 16)}` },
        ],
        [
          { text: "🎤 Vocal", callback_data: `analyze_tr_vocal_${referenceId.substring(0, 16)}` },
          { text: "🎵 Universal", callback_data: `analyze_tr_universal_${referenceId.substring(0, 16)}` },
        ],
        [{ text: "🔙 Назад", callback_data: `analyze_select_${referenceId.substring(0, 20)}` }],
      ],
    },
    "MarkdownV2",
  );
  await answerCallbackQuery(callbackId);
}

/**
 * Run transcription analysis
 */
export async function handleTranscription(
  chatId: number,
  userId: number,
  referenceId: string,
  model: string,
  messageId: number,
  callbackId: string,
): Promise<void> {
  const session = getAnalysisSession(userId);

  if (!session) {
    await answerCallbackQuery(callbackId, "❌ Сессия истекла");
    return;
  }

  await answerCallbackQuery(callbackId, "🔄 Запускаем транскрипцию...");

  await editMessageText(
    chatId,
    messageId,
    `🎼 *Транскрипция*

📁 ${escapeMarkdownV2(session.fileName)}
🎛️ Модель: ${model}

⏳ Анализ может занять 1\\-3 минуты\\.\\.\\.`,
    undefined,
    "MarkdownV2",
  );

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const response = await fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
      },
      body: JSON.stringify({
        audio_url: session.audioUrl,
        mode: "transcription",
        model: model,
        outputs: ["midi", "midi_quant", "gp5", "pdf", "mxml"],
        user_id: session.userId,
        title: session.fileName,
      }),
    });

    const result = await response.json();

    if (result.error) {
      await editMessageText(
        chatId,
        messageId,
        `❌ *Ошибка транскрипции*

${escapeMarkdownV2(result.message || result.error)}`,
        {
          inline_keyboard: [
            [{ text: "🔄 Попробовать снова", callback_data: `analyze_transcribe_${referenceId.substring(0, 20)}` }],
          ],
        },
        "MarkdownV2",
      );
      return;
    }

    // Build result message
    const files = result.files || {};
    const notesCount = result.notes?.length || 0;

    const message = `✅ *Транскрипция завершена\\!*

📁 ${escapeMarkdownV2(session.fileName)}
🎛️ Модель: ${model}
🎵 Нот распознано: ${notesCount}`;

    const downloadButtons: Array<{ text: string; url: string }> = [];

    if (files.midi) {
      downloadButtons.push({ text: "📥 MIDI", url: files.midi });
    }
    if (files.pdf) {
      downloadButtons.push({ text: "📄 PDF", url: files.pdf });
    }
    if (files.gp5) {
      downloadButtons.push({ text: "🎸 Guitar Pro", url: files.gp5 });
    }
    if (files.mxml) {
      downloadButtons.push({ text: "📋 MusicXML", url: files.mxml });
    }

    const keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>> = [];

    // Add download buttons in rows of 2
    for (let i = 0; i < downloadButtons.length; i += 2) {
      const row = downloadButtons.slice(i, i + 2);
      keyboard.push(row);
    }

    keyboard.push([
      { text: "🔍 Новый анализ", callback_data: `analyze_select_${referenceId.substring(0, 20)}` },
      { text: "📂 Мои загрузки", callback_data: "my_uploads" },
    ]);

    await editMessageText(chatId, messageId, message, { inline_keyboard: keyboard }, "MarkdownV2");

    trackMetric({
      eventType: "analyze_transcription",
      success: true,
      telegramChatId: chatId,
      metadata: { model, notesCount },
    });
  } catch (error) {
    logger.error("Error in handleTranscription", error);
    await editMessageText(
      chatId,
      messageId,
      `❌ Ошибка при транскрипции\\. Попробуйте позже\\.`,
      {
        inline_keyboard: [
          [{ text: "🔄 Попробовать снова", callback_data: `analyze_transcribe_${referenceId.substring(0, 20)}` }],
        ],
      },
      "MarkdownV2",
    );
  }
}

/**
 * Run chord recognition
 */
export async function handleChordAnalysis(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string,
): Promise<void> {
  const session = getAnalysisSession(userId);

  if (!session) {
    await answerCallbackQuery(callbackId, "❌ Сессия истекла");
    return;
  }

  await answerCallbackQuery(callbackId, "🔄 Анализируем аккорды...");

  await editMessageText(
    chatId,
    messageId,
    `🎸 *Распознавание аккордов*

📁 ${escapeMarkdownV2(session.fileName)}

⏳ Анализ занимает около минуты\\.\\.\\.`,
    undefined,
    "MarkdownV2",
  );

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const response = await fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
      },
      body: JSON.stringify({
        audio_url: session.audioUrl,
        mode: "chord-recognition-extended",
        vocabulary: "full",
        user_id: session.userId,
      }),
    });

    const result = await response.json();

    if (result.error) {
      await editMessageText(
        chatId,
        messageId,
        `❌ *Ошибка*

${escapeMarkdownV2(result.message || result.error)}`,
        {
          inline_keyboard: [
            [{ text: "🔄 Попробовать снова", callback_data: `analyze_chords_${referenceId.substring(0, 20)}` }],
          ],
        },
        "MarkdownV2",
      );
      return;
    }

    const chords = result.chords || [];
    const key = result.key || "Не определена";
    const strumming = result.strumming || [];

    // Format chords for display
    const uniqueChords = [...new Set(chords.map((c: any) => c.chord))].slice(0, 12);
    const chordsText = uniqueChords.length > 0 ? uniqueChords.join(" \\- ") : "Не распознаны";

    // Format strumming pattern
    let strumPattern = "";
    if (strumming.length > 0) {
      strumPattern = strumming
        .slice(0, 8)
        .map((s: any) => (s.direction === "U" ? "↑" : "↓"))
        .join(" ");
    }

    let message = `✅ *Аккорды распознаны\\!*

📁 ${escapeMarkdownV2(session.fileName)}

🎵 *Тональность:* ${escapeMarkdownV2(key)}
🎸 *Аккорды:* ${chordsText}`;

    if (strumPattern) {
      message += `\n🎶 *Ритм:* ${strumPattern}`;
    }

    message += `\n\n📊 Найдено ${chords.length} аккордовых смен`;

    await editMessageText(
      chatId,
      messageId,
      message,
      {
        inline_keyboard: [
          [
            { text: "🎼 Транскрибировать", callback_data: `analyze_transcribe_${referenceId.substring(0, 20)}` },
            { text: "🥁 Темп", callback_data: `analyze_beats_${referenceId.substring(0, 20)}` },
          ],
          [{ text: "🔙 К меню", callback_data: `analyze_select_${referenceId.substring(0, 20)}` }],
        ],
      },
      "MarkdownV2",
    );

    trackMetric({
      eventType: "analyze_chords",
      success: true,
      telegramChatId: chatId,
      metadata: { chordsCount: chords.length, key },
    });
  } catch (error) {
    logger.error("Error in handleChordAnalysis", error);
    await editMessageText(
      chatId,
      messageId,
      `❌ Ошибка анализа\\. Попробуйте позже\\.`,
      {
        inline_keyboard: [
          [{ text: "🔄 Попробовать снова", callback_data: `analyze_chords_${referenceId.substring(0, 20)}` }],
        ],
      },
      "MarkdownV2",
    );
  }
}

/**
 * Run beat tracking
 */
export async function handleBeatAnalysis(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string,
): Promise<void> {
  const session = getAnalysisSession(userId);

  if (!session) {
    await answerCallbackQuery(callbackId, "❌ Сессия истекла");
    return;
  }

  await answerCallbackQuery(callbackId, "🔄 Анализируем темп...");

  await editMessageText(
    chatId,
    messageId,
    `🥁 *Определение темпа*

📁 ${escapeMarkdownV2(session.fileName)}

⏳ Анализ занимает около минуты\\.\\.\\.`,
    undefined,
    "MarkdownV2",
  );

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const response = await fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
      },
      body: JSON.stringify({
        audio_url: session.audioUrl,
        mode: "beat-tracking",
        user_id: session.userId,
      }),
    });

    const result = await response.json();

    if (result.error) {
      await editMessageText(
        chatId,
        messageId,
        `❌ *Ошибка*

${escapeMarkdownV2(result.message || result.error)}`,
        {
          inline_keyboard: [
            [{ text: "🔄 Попробовать снова", callback_data: `analyze_beats_${referenceId.substring(0, 20)}` }],
          ],
        },
        "MarkdownV2",
      );
      return;
    }

    const bpm = result.bpm || 0;
    const beats = result.beats || [];
    const downbeats = result.downbeats || [];

    // Estimate time signature from downbeats
    let timeSignature = "4/4";
    if (beats.length > 4 && downbeats.length > 1) {
      const beatsPerMeasure = Math.round(beats.filter((b: number) => b < downbeats[1]).length);
      if (beatsPerMeasure === 3) timeSignature = "3/4";
      else if (beatsPerMeasure === 6) timeSignature = "6/8";
    }

    const message = `✅ *Темп определён\\!*

📁 ${escapeMarkdownV2(session.fileName)}

🥁 *BPM:* ${bpm}
🎵 *Размер:* ${timeSignature}
📊 *Битов:* ${beats.length}
📊 *Тактов:* ${downbeats.length}`;

    await editMessageText(
      chatId,
      messageId,
      message,
      {
        inline_keyboard: [
          [
            { text: "🎼 Транскрибировать", callback_data: `analyze_transcribe_${referenceId.substring(0, 20)}` },
            { text: "🎸 Аккорды", callback_data: `analyze_chords_${referenceId.substring(0, 20)}` },
          ],
          [{ text: "🔙 К меню", callback_data: `analyze_select_${referenceId.substring(0, 20)}` }],
        ],
      },
      "MarkdownV2",
    );

    trackMetric({
      eventType: "analyze_beats",
      success: true,
      telegramChatId: chatId,
      metadata: { bpm, beatsCount: beats.length },
    });
  } catch (error) {
    logger.error("Error in handleBeatAnalysis", error);
    await editMessageText(
      chatId,
      messageId,
      `❌ Ошибка анализа\\. Попробуйте позже\\.`,
      {
        inline_keyboard: [
          [{ text: "🔄 Попробовать снова", callback_data: `analyze_beats_${referenceId.substring(0, 20)}` }],
        ],
      },
      "MarkdownV2",
    );
  }
}

/**
 * Run full analysis (all modes)
 */
export async function handleFullAnalysis(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string,
): Promise<void> {
  const session = getAnalysisSession(userId);

  if (!session) {
    await answerCallbackQuery(callbackId, "❌ Сессия истекла");
    return;
  }

  await answerCallbackQuery(callbackId, "🔄 Запускаем полный анализ...");

  await editMessageText(
    chatId,
    messageId,
    `📊 *Полный анализ*

📁 ${escapeMarkdownV2(session.fileName)}

⏳ Выполняем:
• Транскрипция \\(MIDI, PDF\\)
• Распознавание аккордов
• Определение темпа

Это займёт 2\\-5 минут\\.\\.\\.`,
    undefined,
    "MarkdownV2",
  );

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Run all analyses in parallel
    const [transcriptionResult, chordsResult, beatsResult] = await Promise.allSettled([
      fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
        },
        body: JSON.stringify({
          audio_url: session.audioUrl,
          mode: "transcription",
          model: "universal",
          outputs: ["midi", "midi_quant", "gp5", "pdf", "mxml"],
          user_id: session.userId,
          title: session.fileName,
        }),
      }).then((r) => r.json()),

      fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
        },
        body: JSON.stringify({
          audio_url: session.audioUrl,
          mode: "chord-recognition-extended",
          vocabulary: "full",
          user_id: session.userId,
        }),
      }).then((r) => r.json()),

      fetch(`${supabaseUrl}/functions/v1/klangio-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BOT_CONFIG.supabaseServiceKey}`,
        },
        body: JSON.stringify({
          audio_url: session.audioUrl,
          mode: "beat-tracking",
          user_id: session.userId,
        }),
      }).then((r) => r.json()),
    ]);

    // Extract results
    const transcription = transcriptionResult.status === "fulfilled" ? transcriptionResult.value : null;
    const chords = chordsResult.status === "fulfilled" ? chordsResult.value : null;
    const beats = beatsResult.status === "fulfilled" ? beatsResult.value : null;

    // Build comprehensive result message
    let message = `✅ *Полный анализ завершён\\!*

📁 ${escapeMarkdownV2(session.fileName)}`;

    // Beat info
    if (beats && !beats.error) {
      message += `\n\n🥁 *Темп:* ${beats.bpm || "?"} BPM`;
    }

    // Chord info
    if (chords && !chords.error && chords.chords?.length > 0) {
      const key = chords.key || "N/A";
      const uniqueChords = [...new Set(chords.chords.map((c: any) => c.chord))].slice(0, 8);
      message += `\n🎵 *Тональность:* ${escapeMarkdownV2(key)}`;
      message += `\n🎸 *Аккорды:* ${uniqueChords.join(" \\- ")}`;
    }

    // Transcription info
    if (transcription && !transcription.error) {
      const notesCount = transcription.notes?.length || 0;
      message += `\n🎼 *Нот:* ${notesCount}`;
    }

    // Build download buttons
    const downloadButtons: Array<{ text: string; url: string }> = [];
    if (transcription?.files?.midi) {
      downloadButtons.push({ text: "📥 MIDI", url: transcription.files.midi });
    }
    if (transcription?.files?.pdf) {
      downloadButtons.push({ text: "📄 PDF", url: transcription.files.pdf });
    }
    if (transcription?.files?.gp5) {
      downloadButtons.push({ text: "🎸 GP5", url: transcription.files.gp5 });
    }

    const keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>> = [];

    // Add download buttons
    if (downloadButtons.length > 0) {
      for (let i = 0; i < downloadButtons.length; i += 3) {
        keyboard.push(downloadButtons.slice(i, i + 3));
      }
    }

    keyboard.push([
      { text: "🔍 Другой файл", callback_data: "analyze_list" },
      { text: "📂 Мои загрузки", callback_data: "my_uploads" },
    ]);

    await editMessageText(chatId, messageId, message, { inline_keyboard: keyboard }, "MarkdownV2");

    trackMetric({
      eventType: "analyze_full",
      success: true,
      telegramChatId: chatId,
      metadata: {
        bpm: beats?.bpm,
        chordsCount: chords?.chords?.length,
        notesCount: transcription?.notes?.length,
      },
    });
  } catch (error) {
    logger.error("Error in handleFullAnalysis", error);
    await editMessageText(
      chatId,
      messageId,
      `❌ Ошибка при анализе\\. Попробуйте позже\\.`,
      {
        inline_keyboard: [
          [{ text: "🔄 Попробовать снова", callback_data: `analyze_full_${referenceId.substring(0, 20)}` }],
        ],
      },
      "MarkdownV2",
    );
  }
}
