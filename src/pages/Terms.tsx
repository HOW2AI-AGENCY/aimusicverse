import { useNavigate } from "react-router-dom";
import { useTelegram } from "@/contexts/TelegramContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function Terms() {
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
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Условия использования</h1>
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
              <CardTitle>Пользовательское соглашение</CardTitle>
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
                      Добро пожаловать в MusicVerse AI! Настоящее Пользовательское соглашение 
                      регулирует использование вами нашего сервиса по созданию музыки с помощью 
                      искусственного интеллекта через Telegram Mini App и Telegram Bot.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      Используя наш сервис, вы подтверждаете, что прочитали, поняли и согласны 
                      соблюдать настоящие Условия использования.
                    </p>
                  </section>

                  {/* Описание сервиса */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">2. Описание сервиса</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      MusicVerse AI предоставляет платформу для создания музыкальных композиций 
                      с использованием технологий искусственного интеллекта. Сервис включает:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Генерацию музыки на основе текстовых описаний</li>
                      <li>Создание музыки с использованием аудио-референсов</li>
                      <li>Разделение треков на стемы (stems)</li>
                      <li>Управление библиотекой треков и проектами</li>
                      <li>Создание и управление плейлистами</li>
                      <li>Обмен треками с другими пользователями</li>
                      <li>Интеграцию с Telegram для уведомлений и управления</li>
                    </ul>
                  </section>

                  {/* Регистрация и аккаунт */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">3. Регистрация и учетная запись</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Для использования сервиса требуется учетная запись Telegram. При регистрации:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Вы предоставляете точную и актуальную информацию</li>
                      <li>Вы несете ответственность за сохранность своей учетной записи</li>
                      <li>Вы соглашаетесь не передавать доступ к аккаунту третьим лицам</li>
                      <li>Вы обязуетесь незамедлительно сообщать о несанкционированном доступе</li>
                    </ul>
                  </section>

                  {/* Использование сервиса */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">4. Правила использования</h2>
                    <p className="text-muted-foreground leading-relaxed mb-2">
                      При использовании MusicVerse AI вы соглашаетесь:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Использовать сервис только в законных целях</li>
                      <li>Не создавать контент, нарушающий права третьих лиц</li>
                      <li>Не использовать сервис для создания оскорбительного контента</li>
                      <li>Не пытаться обойти технические ограничения платформы</li>
                      <li>Не злоупотреблять ресурсами сервиса (спам, DDoS)</li>
                      <li>Соблюдать авторские права при использовании аудио-референсов</li>
                    </ul>
                  </section>

                  {/* Авторские права */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">5. Интеллектуальная собственность</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      <strong>Права на созданный контент:</strong> Вы сохраняете права на 
                      музыкальные композиции, созданные с помощью нашего сервиса. При этом:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Вы предоставляете нам лицензию на хранение и обработку контента</li>
                      <li>При публичном размещении контента вы даете согласие на его демонстрацию</li>
                      <li>Мы не претендуем на права собственности на ваш контент</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      <strong>Права на сервис:</strong> Все права на программное обеспечение, 
                      дизайн, логотипы и торговые марки принадлежат MusicVerse AI.
                    </p>
                  </section>

                  {/* Конфиденциальность */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">6. Конфиденциальность</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Мы серьезно относимся к защите ваших данных. Подробная информация о сборе, 
                      использовании и защите персональных данных представлена в нашей{" "}
                      <Button
                        variant="link"
                        className="h-auto p-0 text-primary"
                        onClick={() => {
                          hapticFeedback('light');
                          navigate('/privacy');
                        }}
                      >
                        Политике конфиденциальности
                      </Button>.
                    </p>
                  </section>

                  {/* Платежи и возврат */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">7. Платежи и возвраты</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      <strong>Кредиты:</strong> Сервис работает на основе системы кредитов. 
                      Генерация треков расходует кредиты согласно тарифам.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      <strong>Возвраты:</strong> Возврат средств возможен в случае технических 
                      проблем с нашей стороны. Неиспользованные кредиты не подлежат возврату.
                    </p>
                  </section>

                  {/* Ограничение ответственности */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">8. Ограничение ответственности</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Сервис предоставляется "как есть". Мы не гарантируем:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Бесперебойную работу сервиса 24/7</li>
                      <li>Отсутствие ошибок в работе AI</li>
                      <li>Определенное качество генерируемого контента</li>
                      <li>Коммерческую пригодность контента</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      Мы не несем ответственности за убытки, возникшие в результате использования 
                      или невозможности использования сервиса.
                    </p>
                  </section>

                  {/* Прекращение доступа */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">9. Прекращение доступа</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Мы оставляем за собой право приостановить или прекратить ваш доступ к 
                      сервису в случае:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Нарушения условий использования</li>
                      <li>Подозрительной или мошеннической активности</li>
                      <li>По требованию правоохранительных органов</li>
                      <li>Неактивности аккаунта более 12 месяцев</li>
                    </ul>
                  </section>

                  {/* Изменения условий */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">10. Изменения условий</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Мы можем изменять настоящие Условия использования в любое время. 
                      Существенные изменения будут доведены до вашего сведения через:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Уведомления в приложении</li>
                      <li>Сообщения в Telegram</li>
                      <li>Email-рассылку (если указана почта)</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      Продолжение использования сервиса после изменений означает ваше согласие 
                      с новыми условиями.
                    </p>
                  </section>

                  {/* Контакты */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">11. Контактная информация</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      По вопросам, связанным с настоящими Условиями использования, вы можете 
                      связаться с нами:
                    </p>
                    <ul className="list-none mt-2 space-y-1 text-muted-foreground">
                      <li>• Telegram: @AIMusicVerseBot</li>
                      <li>• Email: support@musicverse.ai</li>
                    </ul>
                  </section>

                  {/* Применимое право */}
                  <section>
                    <h2 className="text-lg font-semibold mb-2">12. Применимое право</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Настоящие Условия регулируются и толкуются в соответствии с законодательством, 
                      применимым к месту регистрации сервиса. Любые споры подлежат разрешению в 
                      соответствующих судебных инстанциях.
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
