import { useNavigate, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { useTelegram } from "@/contexts/TelegramContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function ErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError();
  const { hapticFeedback, showBackButton, hideBackButton } = useTelegram();

  let errorMessage = "Произошла неизвестная ошибка";
  let errorDetails = "";
  let statusCode = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data?.message || "Ошибка маршрутизации";
    errorDetails = error.data?.details || "";
    statusCode = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack?.split('\n')[0] || "";
  }

  useEffect(() => {
    logger.error("Route Error", error, { 
      message: errorMessage,
      statusCode,
    });

    // Show Telegram back button
    showBackButton(() => {
      hapticFeedback('light');
      navigate(-1);
    });

    return () => {
      hideBackButton();
    };
  }, [error, errorMessage, statusCode, showBackButton, hideBackButton, hapticFeedback, navigate]);

  const handleRefresh = () => {
    hapticFeedback('light');
    window.location.reload();
  };

  const handleGoHome = () => {
    hapticFeedback('success');
    navigate('/');
  };

  const handleGoBack = () => {
    hapticFeedback('light');
    navigate(-1);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-destructive/20">
          <CardContent className="pt-6 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10"
            >
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </motion.div>

            {/* Error code */}
            {statusCode !== 500 && (
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-6xl font-bold text-destructive"
              >
                {statusCode}
              </motion.h1>
            )}

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-2 text-2xl font-bold"
            >
              Что-то пошло не так
            </motion.h2>

            {/* Error message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-4 text-muted-foreground"
            >
              {errorMessage}
            </motion.p>

            {/* Error details (only in development) */}
            {import.meta.env.DEV && errorDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-6 rounded-lg bg-destructive/10 p-3 text-left"
              >
                <p className="text-xs font-mono text-destructive break-all">
                  {errorDetails}
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
                onClick={handleRefresh} 
                className="w-full"
                size="lg"
                variant="default"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Обновить страницу
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
                  onClick={handleGoHome} 
                  variant="outline"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Главная
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
              Если ошибка повторяется, сообщите о ней в поддержку через @AIMusicVerseBot
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
