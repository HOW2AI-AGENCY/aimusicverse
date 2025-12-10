import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { useTelegram } from "@/contexts/TelegramContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search, AlertCircle } from "lucide-react";
import { motion } from '@/lib/motion';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticFeedback, showBackButton, hideBackButton } = useTelegram();

  useEffect(() => {
    logger.error("404 Error: User attempted to access non-existent route", undefined, { path: location.pathname });
    
    // Show Telegram back button
    showBackButton(() => {
      hapticFeedback('light');
      navigate(-1);
    });

    return () => {
      hideBackButton();
    };
  }, [location.pathname, showBackButton, hideBackButton, hapticFeedback, navigate]);

  const handleGoHome = () => {
    hapticFeedback('light');
    navigate('/');
  };

  const handleGoBack = () => {
    hapticFeedback('light');
    navigate(-1);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardContent className="pt-6 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
            >
              <AlertCircle className="h-12 w-12 text-primary" />
            </motion.div>

            {/* Error code */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-2 text-6xl font-bold text-primary"
            >
              404
            </motion.h1>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-2 text-2xl font-bold"
            >
              Страница не найдена
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 text-muted-foreground"
            >
              К сожалению, запрашиваемая страница не существует или была перемещена
            </motion.p>

            {/* Attempted path */}
            {location.pathname && location.pathname !== '/' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-6 rounded-lg bg-muted p-3"
              >
                <p className="text-xs text-muted-foreground break-all">
                  Путь: <code className="font-mono">{location.pathname}</code>
                </p>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <Button 
                onClick={handleGoHome} 
                className="w-full"
                size="lg"
              >
                <Home className="mr-2 h-5 w-5" />
                На главную
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleGoBack} 
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад
                </Button>
                
                <Button 
                  onClick={() => {
                    hapticFeedback('light');
                    navigate('/library');
                  }} 
                  variant="outline"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Библиотека
                </Button>
              </div>
            </motion.div>

            {/* Help text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-xs text-muted-foreground"
            >
              Если проблема повторяется, свяжитесь с поддержкой через @AIMusicVerseBot
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFound;
