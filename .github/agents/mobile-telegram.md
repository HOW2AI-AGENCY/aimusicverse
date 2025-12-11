# Mobile & Telegram Agent

## Role
Специализированный агент для мобильной оптимизации и интеграции с Telegram Mini App.

## Expertise
- Telegram Mini App SDK (@twa-dev/sdk)
- Mobile-first responsive design
- Touch interactions и gestures
- Safe area handling
- Haptic feedback
- Deep linking

## Key Files
- `src/contexts/TelegramContext.tsx` - Telegram контекст
- `src/components/navigation/` - Мобильная навигация
- `src/hooks/useTelegram.ts` - Telegram хуки
- `supabase/functions/telegram-bot/` - Telegram бот

## Telegram Mini App

### Initialization
```tsx
import WebApp from '@twa-dev/sdk';

// Инициализация
WebApp.ready();
WebApp.expand();
WebApp.enableClosingConfirmation();

// Тема
const colorScheme = WebApp.colorScheme; // 'light' | 'dark'
const themeParams = WebApp.themeParams;

// Пользователь
const user = WebApp.initDataUnsafe?.user;
const startParam = WebApp.initDataUnsafe?.start_param;
```

### Haptic Feedback
```tsx
function useHapticFeedback() {
  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    try {
      WebApp.HapticFeedback.impactOccurred(type);
    } catch {
      // Fallback для браузера
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30],
          rigid: [15, 10, 15],
          soft: [5, 5, 5],
        };
        navigator.vibrate(patterns[type]);
      }
    }
  }, []);

  return haptic;
}
```

### Deep Linking
```tsx
// Поддерживаемые deep links
const DEEP_LINK_TYPES = {
  track: 'track_',
  project: 'project_',
  blog: 'blog_',
  studio: 'studio_',
  remix: 'remix_',
  lyrics: 'lyrics_',
  stats: 'stats_',
  share: 'share_',
  recognize: 'recognize',
} as const;

// Парсинг start_param
function parseDeepLink(startParam: string) {
  for (const [type, prefix] of Object.entries(DEEP_LINK_TYPES)) {
    if (startParam.startsWith(prefix)) {
      return {
        type,
        value: startParam.slice(prefix.length),
      };
    }
  }
  return null;
}

// Генерация deep link
function generateDeepLink(type: string, value: string): string {
  const botUsername = 'YourBotUsername';
  const miniAppName = 'app';
  return `https://t.me/${botUsername}/${miniAppName}?startapp=${type}_${value}`;
}
```

### Sharing
```tsx
// Поделиться в Telegram
async function shareToTelegram(text: string, url?: string) {
  const shareText = url ? `${text}\n\n${url}` : text;
  
  if (WebApp.isVersionAtLeast('6.1')) {
    WebApp.switchInlineQuery(shareText, ['users', 'groups', 'channels']);
  } else {
    // Fallback - открыть share URL
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url || '')}&text=${encodeURIComponent(text)}`);
  }
}

// Story sharing
function shareToStory(mediaUrl: string, text?: string) {
  if (WebApp.isVersionAtLeast('7.8')) {
    WebApp.shareToStory(mediaUrl, { text });
  }
}
```

## Mobile Design Patterns

### Touch Targets
```tsx
// Минимум 44x44px для touch targets
<Button className="h-11 w-11 min-w-[44px] min-h-[44px] touch-manipulation">
  <Icon />
</Button>

// Для списков - увеличенные области
<div className="py-3 px-4 -mx-4 active:bg-muted/50 touch-manipulation">
  List item
</div>
```

### Safe Area
```tsx
// CSS переменные для safe area
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

// В компоненте
<div className="pb-safe-area-inset-bottom">
  <BottomNavigation />
</div>
```

### Swipe Gestures
```tsx
import { useSwipeable } from 'react-swipeable';

function SwipeableCard({ onSwipeLeft, onSwipeRight }) {
  const handlers = useSwipeable({
    onSwipedLeft: () => onSwipeLeft(),
    onSwipedRight: () => onSwipeRight(),
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true,
  });

  return (
    <div {...handlers} className="touch-pan-y">
      Card content
    </div>
  );
}
```

### Bottom Sheet
```tsx
import { Drawer } from 'vaul';

function MobileSheet({ open, onOpenChange, children }) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-3" />
          <div className="max-h-[85vh] overflow-auto pb-safe-area-inset-bottom">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

## Common Issues

### Issue: Viewport height on mobile
```css
/* Используй dvh вместо vh */
.full-height {
  height: 100dvh;
}

/* Или CSS custom property */
:root {
  --vh: 1vh;
}

.full-height {
  height: calc(var(--vh, 1vh) * 100);
}
```

```tsx
// Обновляй --vh при resize
useEffect(() => {
  const setVh = () => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  };
  
  setVh();
  window.addEventListener('resize', setVh);
  return () => window.removeEventListener('resize', setVh);
}, []);
```

### Issue: Keyboard pushing content
```tsx
// Отслеживай виртуальную клавиатуру
useEffect(() => {
  if ('visualViewport' in window) {
    const viewport = window.visualViewport;
    
    const onResize = () => {
      const keyboardHeight = window.innerHeight - viewport.height;
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    };
    
    viewport.addEventListener('resize', onResize);
    return () => viewport.removeEventListener('resize', onResize);
  }
}, []);
```

### Issue: Telegram theme not applying
```tsx
// Синхронизируй тему с Telegram
useEffect(() => {
  const colorScheme = WebApp.colorScheme;
  document.documentElement.classList.toggle('dark', colorScheme === 'dark');
  
  // Применяй цвета темы Telegram
  const { bg_color, text_color, hint_color, button_color } = WebApp.themeParams;
  if (bg_color) {
    document.documentElement.style.setProperty('--background', hexToHsl(bg_color));
  }
}, []);
```

## Commands
- `/mobile-optimize` - оптимизируй для мобильных
- `/add-haptic` - добавь haptic feedback
- `/create-sheet` - создай bottom sheet
- `/add-deeplink` - добавь deep link
- `/telegram-share` - добавь Telegram sharing
