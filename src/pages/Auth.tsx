import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useGuestMode } from "@/contexts/GuestModeContext";
import { Loader2, Music, Eye } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingScreen } from "@/components/UnifiedSplashScreen";
import { AppLogo } from "@/components/branding/AppLogo";
import { logger } from "@/lib/logger";
import { LazyImage } from "@/components/ui/lazy-image";

const isSafeRelativePath = (value: string | null | undefined): value is string =>
  !!value && value.startsWith("/") && !value.startsWith("//");

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading, isTelegramAuthPending, authenticateWithTelegram } = useAuth();
  const { webApp, user, isInitialized, isDevelopmentMode } = useTelegram();
  const { enableGuestMode } = useGuestMode();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Preserve `next` for OAuth consent round-trips, and `state.from` for the
  // route the ProtectedRoute guard bounced us out of. Same-origin paths only.
  const rawNext = searchParams.get("next");
  const rawFrom = (location.state as { from?: string } | null)?.from;
  const nextPath = isSafeRelativePath(rawNext) ? rawNext : isSafeRelativePath(rawFrom) ? rawFrom : "/";


  const handleAuth = async () => {
    setIsAuthenticating(true);
    const result = await authenticateWithTelegram();
    setIsAuthenticating(false);

    if (result?.session) {
      navigate(nextPath, { replace: true });
    }
  };

  const handleGuestMode = () => {
    enableGuestMode();
    navigate(nextPath, { replace: true });
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, navigate, nextPath]);

  // Splash logic removed - handled by index.html + Suspense fallback

  // Auto-authenticate in development mode.
  //
  // Two guards protect this convenience shortcut:
  //   1. `autoAuthAttempted` (one-shot ref) — the dev sign-in can fail
  //      (bad creds, offline, CORS). Without a latch the effect re-fires on
  //      every `isAuthenticating` false→true→false cycle, producing an
  //      infinite retry storm. Fire at most once; the manual "Войти как Test
  //      User" button stays available for a retry.
  //   2. `navigator.webdriver` — under an automated browser (Playwright sets
  //      this in every engine) the headless Supabase password sign-in is
  //      CORS-blocked in WebKit and surfaces as an uncaught page error, which
  //      fails the smoke suite's `pageErrors === []` assertion. E2E runs
  //      exercise the guest/manual surfaces, so skip auto-auth entirely there.
  const autoAuthAttempted = useRef(false);
  useEffect(() => {
    const isAutomatedBrowser = typeof navigator !== "undefined" && navigator.webdriver === true;
    if (
      isDevelopmentMode &&
      !isAutomatedBrowser &&
      !isAuthenticated &&
      !loading &&
      !isAuthenticating &&
      !autoAuthAttempted.current
    ) {
      autoAuthAttempted.current = true;
      logger.debug("Auto-authenticating in dev mode...");
      handleAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDevelopmentMode, isAuthenticated, loading, isAuthenticating]);

  // Show loading while initializing, or while the Telegram initData handshake
  // is still in flight (otherwise we'd flash the manual login card and let the
  // user start a second, competing auth attempt).
  if (!isInitialized || loading || isTelegramAuthPending) {
    return <LoadingScreen message="Инициализация..." />;
  }


  // In development mode, always show test user login option
  if (isDevelopmentMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-md w-full glass-card border-primary/20">
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="mb-4 flex justify-center">
                <AppLogo size="lg" variant="default" />
              </div>
              <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Режим разработки
              </h1>
              <p className="text-muted-foreground mb-4">Вы работаете в режиме тестирования без Telegram</p>
            </div>

            {loading || isAuthenticating ? (
              <div className="py-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Создание тестовой сессии...</p>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleAuth}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="lg"
                >
                  Войти как Test User
                </Button>

                <Button onClick={handleGuestMode} variant="outline" className="w-full mt-3" size="lg">
                  <Eye className="w-4 h-4 mr-2" />
                  Попробовать без авторизации
                </Button>
              </>
            )}

            <div className="mt-6 p-4 glass rounded-lg text-left">
              <p className="text-xs text-muted-foreground mb-2">
                <strong>Для продакшена:</strong> Откройте приложение через Telegram Mini App
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Для разработки:</strong> Используйте любой домен lovable или localhost
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Check if Telegram user is available (production mode)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-md w-full glass-card border-primary/20">
          <div className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <AppLogo size="lg" variant="default" />
            </div>
            <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Требуется Telegram
            </h1>
            <p className="text-muted-foreground mb-6">Это приложение должно быть открыто через Telegram.</p>
            <p className="text-sm text-muted-foreground mb-6">
              Пожалуйста, откройте приложение из вашего Telegram бота.
            </p>

            <Button onClick={handleGuestMode} variant="outline" className="w-full" size="lg">
              <Eye className="w-4 h-4 mr-2" />
              Попробовать без авторизации
            </Button>

            <div className="mt-4 p-3 glass rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                В гостевом режиме вы можете просматривать интерфейс и публичные треки
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="max-w-md w-full glass-card border-primary/20">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="mb-4 flex justify-center">
              <AppLogo size="lg" variant="default" />
            </div>
            <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Добро пожаловать в MusicVerse!
            </h1>

            {user.photo_url && (
              <div className="mb-4 flex justify-center">
                <LazyImage
                  src={user.photo_url}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border-2 border-primary/30"
                />
              </div>
            )}

            <p className="text-lg font-semibold text-foreground">
              {user.first_name} {user.last_name}
            </p>
            {user.username && <p className="text-sm text-muted-foreground mb-2">@{user.username}</p>}
            <p className="text-xs text-muted-foreground mt-2">Нажмите "Продолжить" для авторизации через Telegram</p>
          </div>

          {loading || isAuthenticating ? (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Авторизация...</p>
              <p className="text-xs text-muted-foreground/60 mt-2">Проверяем данные Telegram...</p>
            </div>
          ) : (
            <>
              <Button
                onClick={handleAuth}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                Продолжить
              </Button>

              <Button onClick={handleGuestMode} variant="outline" className="w-full mt-3" size="lg">
                <Eye className="w-4 h-4 mr-2" />
                Попробовать без авторизации
              </Button>

              <div className="mt-4 p-3 glass rounded-lg">
                <p className="text-xs text-muted-foreground text-center">✨ Безопасная авторизация через Telegram</p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;
