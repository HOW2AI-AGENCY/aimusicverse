/**
 * Telegram Tab
 * 
 * Telegram bot setup, emoji picker, and integration features.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, CheckCircle2 } from 'lucide-react';
import { motion } from '@/lib/motion';
import { TelegramBotSetup } from '@/components/TelegramBotSetup';
import { AddToHomeScreen } from '@/components/telegram/AddToHomeScreen';
import { ProfileEmojiPicker } from '@/components/settings/ProfileEmojiPicker';

const TELEGRAM_FEATURES = [
  'Уведомления о готовых треках с аудио',
  'Быстрый доступ к библиотеке через deep-links',
  'Шеринг треков и плейлистов в чаты',
  'Inline-режим для поиска треков',
  'Голосовые сообщения с транскрипцией',
  'Публикация в Stories',
];

export function TelegramTab() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <TelegramBotSetup />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <ProfileEmojiPicker />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Быстрый доступ
            </CardTitle>
            <CardDescription>
              Добавьте приложение на главный экран
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddToHomeScreen />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Telegram интеграция
            </CardTitle>
            <CardDescription>
              Возможности бота @AIMusicVerseBot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {TELEGRAM_FEATURES.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
