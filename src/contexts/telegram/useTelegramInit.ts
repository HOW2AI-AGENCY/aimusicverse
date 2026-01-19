/**
 * Telegram Initialization Hook
 * 
 * Handles Telegram WebApp initialization, safe areas, and theme.
 * Extracted from TelegramContext.tsx for modularity.
 * 
 * @module contexts/telegram/useTelegramInit
 */

import { useEffect, useRef, useState } from 'react';
import { authenticateWithTelegram } from '@/services/telegram';
import { logger } from '@/lib/logger';
import { createMockWebApp } from './mockWebApp';
import type { TelegramWebApp, TelegramUser, SafeAreaHandlers } from './types';

const telegramLogger = logger.child({ module: 'TelegramInit' });

// Boot logging helper
const bootLog = (msg: string) => {
  const entry = `[TelegramContext] ${msg}`;
  console.log(entry);
  try {
    const existing = JSON.parse(sessionStorage.getItem('musicverse_boot_log') || '[]');
    existing.push(`[${new Date().toISOString()}] ${entry}`);
    sessionStorage.setItem('musicverse_boot_log', JSON.stringify(existing));
  } catch {
    // Ignore storage errors
  }
};

interface UseTelegramInitResult {
  webApp: TelegramWebApp | null;
  user: TelegramUser | null;
  platform: string;
  initData: string;
  isInitialized: boolean;
  isDevelopmentMode: boolean;
}

export function useTelegramInit(): UseTelegramInitResult {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [platform, setPlatform] = useState<string>('');
  const [initData, setInitData] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);

  const safeAreaHandlersRef = useRef<SafeAreaHandlers>({
    handleViewportChanged: null,
    handleFullscreenChanged: null,
    handleSafeAreaChanged: null,
    handleContentSafeAreaChanged: null,
  });

  useEffect(() => {
    bootLog('TelegramProvider useEffect started');
    
    const devMode = window.location.hostname.includes('lovable.dev') ||
                    window.location.hostname.includes('lovable.app') ||
                    window.location.hostname.includes('lovableproject.com') ||
                    window.location.hostname === 'localhost' ||
                    window.location.search.includes('dev=1');
    
    bootLog(`DevMode: ${devMode}, Telegram WebApp: ${!!window.Telegram?.WebApp}`);
    setIsDevelopmentMode(devMode);

    let initializationTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 2; // Reduced from 3 for faster fallback
    const INITIAL_TIMEOUT = 1500; // Reduced from 3000ms for faster load
    const RETRY_TIMEOUT = 1000;   // Reduced from 2000ms
    
    const ensureInitialized = () => {
      bootLog('ensureInitialized called');
      setIsInitialized(true);
      telegramLogger.info('TelegramProvider initialized');
    };

    const scheduleTimeout = (timeout: number) => {
      return setTimeout(() => {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          bootLog(`Initialization attempt ${retryCount} timed out, retrying...`);
          telegramLogger.warn(`Initialization timeout (attempt ${retryCount}/${MAX_RETRIES})`);
          // Schedule next retry with shorter timeout
          initializationTimeout = scheduleTimeout(RETRY_TIMEOUT);
        } else {
          bootLog(`Initialization TIMEOUT after ${MAX_RETRIES} attempts - forcing complete`);
          telegramLogger.error('Initialization failed after max retries, forcing complete');
          ensureInitialized();
        }
      }, timeout);
    };

    initializationTimeout = scheduleTimeout(INITIAL_TIMEOUT);
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      bootLog(`Telegram WebApp found: platform=${tg.platform}, version=${tg.version}`);
      setWebApp(tg);

      telegramLogger.info('Telegram WebApp detected', {
        platform: tg.platform,
        version: tg.version,
        colorScheme: tg.colorScheme
      });

      // Initialize Telegram WebApp
      try { tg.ready(); bootLog('tg.ready() called'); } 
      catch (e) { bootLog(`tg.ready() error: ${e}`); }
      
      try { tg.expand(); bootLog('tg.expand() called'); } 
      catch (e) { bootLog(`tg.expand() error: ${e}`); }

      // Disable vertical swipes
      if (typeof (tg as any).disableVerticalSwipes === 'function') {
        try { (tg as any).disableVerticalSwipes(); bootLog('Vertical swipes disabled'); } 
        catch (e) { bootLog(`disableVerticalSwipes error: ${e}`); }
      }

      // Lock orientation
      if (typeof (tg as any).lockOrientation === 'function') {
        try { (tg as any).lockOrientation(); bootLog('Orientation locked'); } 
        catch (e) { bootLog(`lockOrientation error: ${e}`); }
      }

      // Request fullscreen (Mini App 2.0+)
      if (tg.isVersionAtLeast?.('8.0') && typeof (tg as any).requestFullscreen === 'function') {
        try { (tg as any).requestFullscreen(); bootLog('Fullscreen requested'); } 
        catch (e) { bootLog(`Fullscreen error: ${e}`); }
      }

      // Set colors
      try {
        if (tg.isVersionAtLeast?.('6.1')) {
          if (tg.setHeaderColor) tg.setHeaderColor('secondary_bg_color');
          if (tg.setBackgroundColor) tg.setBackgroundColor('bg_color');
          bootLog('Colors set');
        }
      } catch (e) { bootLog(`Colors error: ${e}`); }

      // Set user
      if (tg.initDataUnsafe?.user) {
        bootLog(`User found: ${tg.initDataUnsafe.user.first_name} (${tg.initDataUnsafe.user.id})`);
        setUser({
          telegram_id: tg.initDataUnsafe.user.id,
          first_name: tg.initDataUnsafe.user.first_name,
          last_name: tg.initDataUnsafe.user.last_name,
          username: tg.initDataUnsafe.user.username,
          language_code: tg.initDataUnsafe.user.language_code,
          photo_url: tg.initDataUnsafe.user.photo_url,
        });
      }

      setPlatform(tg.platform);

      if (tg.initData) {
        bootLog(`InitData received, length=${tg.initData.length}`);
        
        bootLog('Starting auth...');
        authenticateWithTelegram(tg.initData)
          .then(authData => {
            bootLog(`Auth result: ${authData ? 'success' : 'failed'}`);
          })
          .catch(err => {
            bootLog(`Auth error: ${err}`);
            telegramLogger.error('Telegram authentication error', err);
          })
          .finally(() => {
            bootLog('Auth finally block - calling ensureInitialized');
            clearTimeout(initializationTimeout);
            ensureInitialized();
          });
      } else {
        bootLog('INFO: InitData not available (expected outside Telegram)');
        clearTimeout(initializationTimeout);
        ensureInitialized();
      }

      setInitData(tg.initData);

      // Apply theme and safe areas
      applyTelegramTheme(tg);
      const handlers = setupSafeAreaHandlers(tg);
      safeAreaHandlersRef.current = handlers;

    } else if (devMode) {
      telegramLogger.info('Development mode: Using mock Telegram data');
      
      setUser({
        telegram_id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'ru',
      });
      
      setPlatform('web');
      setInitData('development_mode');
      setWebApp(createMockWebApp());
      clearTimeout(initializationTimeout);
      ensureInitialized();
    } else {
      telegramLogger.warn('Not in Telegram and not in dev mode');
      clearTimeout(initializationTimeout);
      ensureInitialized();
    }

    return () => {
      clearTimeout(initializationTimeout);
      cleanupSafeAreaHandlers(safeAreaHandlersRef.current);
    };
  }, []);

  return {
    webApp,
    user,
    platform,
    initData,
    isInitialized,
    isDevelopmentMode,
  };
}

// ============ Helper Functions ============

function applyTelegramTheme(tg: TelegramWebApp) {
  const root = document.documentElement;
  const themeParams = tg.themeParams;
  
  if (themeParams.bg_color) root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
  if (themeParams.text_color) root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
  if (themeParams.button_color) root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
  if (themeParams.button_text_color) root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
  if (themeParams.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color);
}

function setupSafeAreaHandlers(tg: TelegramWebApp): SafeAreaHandlers {
  const root = document.documentElement;
  let isApplyingInsets = false;
  let debounceTimer: NodeJS.Timeout | null = null;
  const previousInsets = { contentTop: -1, contentBottom: -1, safeTop: -1, safeBottom: -1 };

  const applySafeAreaInsets = () => {
    if (isApplyingInsets) return;
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      isApplyingInsets = true;
      
      try {
        const contentSafeArea = (tg as any).contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
        const safeArea = (tg as any).safeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
        
        if (
          previousInsets.contentTop === contentSafeArea.top &&
          previousInsets.contentBottom === contentSafeArea.bottom &&
          previousInsets.safeTop === safeArea.top &&
          previousInsets.safeBottom === safeArea.bottom
        ) return;

        previousInsets.contentTop = contentSafeArea.top;
        previousInsets.contentBottom = contentSafeArea.bottom;
        previousInsets.safeTop = safeArea.top;
        previousInsets.safeBottom = safeArea.bottom;

        root.style.setProperty('--tg-content-safe-area-inset-top', `${contentSafeArea.top}px`);
        root.style.setProperty('--tg-content-safe-area-inset-bottom', `${contentSafeArea.bottom}px`);
        root.style.setProperty('--tg-safe-area-inset-top', `${safeArea.top}px`);
        root.style.setProperty('--tg-safe-area-inset-bottom', `${safeArea.bottom}px`);
        
        const isIOS = tg.platform === 'ios';
        const isAndroid = tg.platform === 'android';
        
        if (isIOS) {
          root.style.setProperty('--safe-area-top', `max(env(safe-area-inset-top, 44px), ${contentSafeArea.top}px)`);
          root.style.setProperty('--safe-area-bottom', `max(env(safe-area-inset-bottom, 34px), ${contentSafeArea.bottom}px)`);
        } else if (isAndroid) {
          root.style.setProperty('--safe-area-top', `max(env(safe-area-inset-top, 24px), ${contentSafeArea.top}px)`);
          root.style.setProperty('--safe-area-bottom', `max(env(safe-area-inset-bottom, 0px), ${contentSafeArea.bottom}px)`);
        } else {
          root.style.setProperty('--safe-area-top', `max(env(safe-area-inset-top, 0px), ${contentSafeArea.top}px)`);
          root.style.setProperty('--safe-area-bottom', `max(env(safe-area-inset-bottom, 0px), ${contentSafeArea.bottom}px)`);
        }
        
        root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
        root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
      } finally {
        isApplyingInsets = false;
      }
    }, 100);
  };

  applySafeAreaInsets();

  const handleViewportChanged = (...args: unknown[]) => {
    const event = args[0] as { height?: number; stableHeight?: number } | undefined;
    if (event?.height) root.style.setProperty('--tg-viewport-height', `${event.height}px`);
    if (event?.stableHeight) root.style.setProperty('--tg-viewport-stable-height', `${event.stableHeight}px`);
    applySafeAreaInsets();
  };

  const handleFullscreenChanged = () => applySafeAreaInsets();
  const handleSafeAreaChanged = () => applySafeAreaInsets();
  const handleContentSafeAreaChanged = () => applySafeAreaInsets();

  if ((tg as any).viewportHeight) {
    root.style.setProperty('--tg-viewport-height', `${(tg as any).viewportHeight}px`);
  }
  if ((tg as any).viewportStableHeight) {
    root.style.setProperty('--tg-viewport-stable-height', `${(tg as any).viewportStableHeight}px`);
  }

  tg.onEvent?.('viewportChanged', handleViewportChanged);
  tg.onEvent?.('fullscreenChanged', handleFullscreenChanged);
  tg.onEvent?.('safeAreaChanged', handleSafeAreaChanged);
  tg.onEvent?.('contentSafeAreaChanged', handleContentSafeAreaChanged);

  return {
    handleViewportChanged,
    handleFullscreenChanged,
    handleSafeAreaChanged,
    handleContentSafeAreaChanged,
  };
}

function cleanupSafeAreaHandlers(handlers: SafeAreaHandlers) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    if (tg.offEvent && handlers) {
      if (handlers.handleViewportChanged) tg.offEvent('viewportChanged', handlers.handleViewportChanged);
      if (handlers.handleFullscreenChanged) tg.offEvent('fullscreenChanged', handlers.handleFullscreenChanged);
      if (handlers.handleSafeAreaChanged) tg.offEvent('safeAreaChanged', handlers.handleSafeAreaChanged);
      if (handlers.handleContentSafeAreaChanged) tg.offEvent('contentSafeAreaChanged', handlers.handleContentSafeAreaChanged);
    }
  }
}
