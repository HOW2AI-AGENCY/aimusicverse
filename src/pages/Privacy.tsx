import { useNavigate } from "react-router-dom";
import { useTelegram } from "@/contexts/TelegramContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function Privacy() {
  const navigate = useNavigate();
  const { showBackButton, hideBackButton, hapticFeedback } = useTelegram();

  useEffect(() => {
    // Show Telegram back button
    showBackButton(() => {
      hapticFeedback('light');
      navigate(-1);
    });

    return () => {
      hideBackButton();
    };
  }, [showBackButton, hideBackButton, hapticFeedback, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              hapticFeedback('light');
              navigate(-1);
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Политика конфиденциальности</h1>
              <p className="text-sm text-muted-foreground">MusicVerse AI</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Защита персональных данных</CardTitle>
              <p className="text-sm text-muted-foreground">
                Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-6 text-sm pr-4">
                  {/* Введение */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">1. Введение</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Настоящая Политика конфиденциальности описывает, как MusicVerse AI 
                      ("мы", "нас", "наш") собирает, использует, хранит и защищает вашу 
                      персональную информацию при использовании нашего сервиса через 
                      Telegram Mini App и Telegram Bot.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      Мы серьезно относимся к защите ваших данных и соблюдаем требования 
                      применимого законодательства о защите персональных данных.
                    </p>
                  </section>

                  {/* Собираемые данные */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">2. Какие данные мы собираем</h2>
                    
                    <h3 className="font-semibold mt-3 mb-1">2.1. Данные из Telegram</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      При авторизации через Telegram мы получаем:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>ID пользователя Telegram</li>
                      <li>Имя и фамилия</li>
                      <li>Username (если указан)</li>
                      <li>Фото профиля (если доступно)</li>
                      <li>Код языка интерфейса</li>
                    </ul>

                    <h3 className="font-semibold mt-3 mb-1">2.2. Создаваемый контент</h3>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Музыкальные треки и их метаданные</li>
                      <li>Текстовые описания (промпты) для генерации</li>
                      <li>Загруженные аудио-файлы (референсы)</li>
                      <li>Созданные плейлисты и проекты</li>
                      <li>Комментарии и описания</li>
                    </ul>

                    <h3 className="font-semibold mt-3 mb-1">2.3. Данные об использовании</h3>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>История генераций и их статус</li>
                      <li>Настройки и предпочтения</li>
                      <li>Статистика прослушиваний</li>
                      <li>История взаимодействий (лайки, добавления в плейлист)</li>
                    </ul>

                    <h3 className="font-semibold mt-3 mb-1">2.4. Технические данные</h3>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>IP-адрес (для защиты от злоупотреблений)</li>
                      <li>Тип устройства и платформа (iOS, Android, Web)</li>
                      <li>Версия Telegram и Mini App</li>
                      <li>Логи ошибок и производительности</li>
                    </ul>
                  </section>

                  {/* Использование данных */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">3. Как мы используем ваши данные</h2>
                    <p className="text-muted-foreground leading-relaxed mb-2">
                      Мы используем собранную информацию для:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li><strong>Предоставления сервиса:</strong> генерация музыки, хранение треков, управление библиотекой</li>
                      <li><strong>Персонализации:</strong> рекомендации, настройки интерфейса</li>
                      <li><strong>Коммуникации:</strong> уведомления о статусе генерации, важные обновления</li>
                      <li><strong>Улучшения сервиса:</strong> анализ использования, выявление проблем</li>
                      <li><strong>Безопасности:</strong> защита от мошенничества и злоупотреблений</li>
                      <li><strong>Соблюдения закона:</strong> выполнение юридических обязательств</li>
                    </ul>
                  </section>

                  {/* Хранение данных */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">4. Хранение и защита данных</h2>
                    
                    <h3 className="font-semibold mt-3 mb-1">4.1. Где хранятся данные</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Ваши данные хранятся на защищенных серверах Supabase (на базе PostgreSQL) 
                      с резервным копированием. Аудио-файлы хранятся в Supabase Storage с 
                      шифрованием при передаче и хранении.
                    </p>

                    <h3 className="font-semibold mt-3 mb-1">4.2. Меры безопасности</h3>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Шифрование данных при передаче (HTTPS/TLS)</li>
                      <li>Row Level Security (RLS) для изоляции пользовательских данных</li>
                      <li>Регулярные резервные копии</li>
                      <li>Мониторинг безопасности и логирование доступа</li>
                      <li>Двухфакторная аутентификация для администраторов</li>
                    </ul>

                    <h3 className="font-semibold mt-3 mb-1">4.3. Срок хранения</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Мы храним ваши данные пока вы активно используете сервис. При удалении 
                      аккаунта большинство данных удаляется в течение 30 дней, за исключением:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Публичного контента (остается доступным сообществу)</li>
                      <li>Данных для бухгалтерии (хранятся согласно законодательству)</li>
                      <li>Логов безопасности (до 90 дней)</li>
                    </ul>
                  </section>

                  {/* Передача данных */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">5. Передача данных третьим лицам</h2>
                    
                    <h3 className="font-semibold mt-3 mb-1">5.1. Сервис-провайдеры</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Мы передаем данные следующим сервисам для работы платформы:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><strong>Supabase:</strong> хранение данных и аутентификация</li>
                      <li><strong>Suno AI:</strong> генерация музыки (передаются только промпты и аудио-референсы)</li>
                      <li><strong>Telegram:</strong> отправка уведомлений и взаимодействие через бот</li>
                    </ul>

                    <h3 className="font-semibold mt-3 mb-1">5.2. Публичный контент</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Если вы делаете ваш контент публичным:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Треки становятся доступны другим пользователям</li>
                      <li>Отображается ваше имя и фото профиля</li>
                      <li>Контент может индексироваться поисковыми системами</li>
                    </ul>

                    <h3 className="font-semibold mt-3 mb-1">5.3. Юридические требования</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Мы можем раскрыть информацию если это требуется законом или для:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Соблюдения судебных решений</li>
                      <li>Защиты прав и безопасности пользователей</li>
                      <li>Расследования мошенничества</li>
                    </ul>
                  </section>

                  {/* Права пользователей */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">6. Ваши права</h2>
                    <p className="text-muted-foreground leading-relaxed mb-2">
                      Вы имеете право:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li><strong>Доступ:</strong> запросить копию ваших данных</li>
                      <li><strong>Исправление:</strong> обновить неточную информацию</li>
                      <li><strong>Удаление:</strong> удалить ваш аккаунт и данные</li>
                      <li><strong>Ограничение:</strong> ограничить обработку данных</li>
                      <li><strong>Переносимость:</strong> получить данные в машиночитаемом формате</li>
                      <li><strong>Возражение:</strong> возразить против определенных видов обработки</li>
                      <li><strong>Отзыв согласия:</strong> отозвать согласие на обработку данных</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      Для реализации этих прав обратитесь к нам через @AIMusicVerseBot или 
                      support@musicverse.ai
                    </p>
                  </section>

                  {/* Cookies и аналитика */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">7. Cookies и аналитика</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Мы используем минимальное количество технологий отслеживания:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><strong>LocalStorage:</strong> для хранения настроек интерфейса</li>
                      <li><strong>Session Storage:</strong> для временных данных сеанса</li>
                      <li><strong>Telegram CloudStorage:</strong> для синхронизации настроек</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      Мы НЕ используем сторонние системы аналитики (Google Analytics и т.п.). 
                      Вся аналитика происходит на нашей инфраструктуре.
                    </p>
                  </section>

                  {/* Дети */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">8. Защита данных детей</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Наш сервис предназначен для пользователей старше 13 лет. Мы не собираем 
                      намеренно данные детей младше 13 лет. Если вы узнали, что ребенок 
                      предоставил нам персональные данные, пожалуйста, свяжитесь с нами для 
                      их удаления.
                    </p>
                  </section>

                  {/* Международная передача */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">9. Международная передача данных</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Ваши данные могут обрабатываться в странах, где расположены наши 
                      сервис-провайдеры. Мы обеспечиваем адекватный уровень защиты данных 
                      в соответствии с применимым законодательством.
                    </p>
                  </section>

                  {/* Изменения политики */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">10. Изменения политики</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Мы можем обновлять эту Политику конфиденциальности. Существенные 
                      изменения будут доведены до вашего сведения через:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Уведомления в приложении</li>
                      <li>Сообщения через Telegram Bot</li>
                      <li>Email (если указан)</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      Продолжение использования сервиса после изменений означает ваше 
                      согласие с обновленной политикой.
                    </p>
                  </section>

                  {/* Контакты */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">11. Контактная информация</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      По вопросам конфиденциальности и защиты данных:
                    </p>
                    <ul className="list-none mt-2 space-y-1 text-muted-foreground">
                      <li>• Telegram: @AIMusicVerseBot</li>
                      <li>• Email: privacy@musicverse.ai</li>
                      <li>• Email поддержки: support@musicverse.ai</li>
                    </ul>
                  </section>

                  {/* Согласие */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">12. Согласие</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Используя MusicVerse AI, вы подтверждаете, что прочитали и поняли 
                      настоящую Политику конфиденциальности и даете согласие на обработку 
                      ваших персональных данных в соответствии с описанными условиями.
                    </p>
                  </section>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accept Button */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button 
            onClick={() => {
              hapticFeedback('success');
              navigate(-1);
            }}
            className="w-full"
          >
            Понятно
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
