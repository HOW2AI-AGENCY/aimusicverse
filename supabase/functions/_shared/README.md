# Shared Utilities for Supabase Edge Functions

This directory contains shared utilities and configurations used across multiple Edge Functions.

## Modules

### `telegram-config.ts`

Centralized Telegram bot configuration and deep link generation.

#### Usage

```typescript
import { getTelegramConfig, getTrackDeepLink } from '../_shared/telegram-config.ts';

// Get configuration
const config = getTelegramConfig();
console.log(config.deepLinkBase); // https://t.me/AIMusicVerseBot/app

// Generate deep links
const trackLink = getTrackDeepLink('abc-123');
// Result: https://t.me/AIMusicVerseBot/app?startapp=track_abc-123

const projectLink = getProjectDeepLink('xyz-789');
// Result: https://t.me/AIMusicVerseBot/app?startapp=project_xyz-789

const generateLink = getGenerateDeepLink('ambient');
// Result: https://t.me/AIMusicVerseBot/app?startapp=generate_ambient
```

#### Environment Variables

- `TELEGRAM_BOT_USERNAME` - Bot username (default: "AIMusicVerseBot")
- `TELEGRAM_APP_SHORT_NAME` - Mini App short name (default: "app")
- `MINI_APP_URL` - Full Mini App URL for web_app buttons

#### Deep Link Format

Telegram Mini App deep links follow this format:
```
https://t.me/{BOT_USERNAME}/{APP_SHORT_NAME}?startapp={param}
```

The `startapp` parameter is passed to the Mini App via:
```javascript
window.Telegram.WebApp.initDataUnsafe.start_param
```

#### Functions

##### `getTelegramConfig()`
Returns the current Telegram configuration object.

**Returns:**
```typescript
{
  botUsername: string,
  appShortName: string,
  miniAppUrl: string,
  deepLinkBase: string  // URL without ?startapp parameter
}
```

##### `generateDeepLink(type: string, id?: string): string`
Generate a deep link for any resource type.

**Parameters:**
- `type` - Resource type (e.g., 'track', 'project', 'generate')
- `id` - Optional resource ID

**Returns:** Full deep link URL

##### `getTrackDeepLink(trackId: string): string`
Generate deep link for a track.

##### `getProjectDeepLink(projectId: string): string`
Generate deep link for a project.

##### `getGenerateDeepLink(style?: string): string`
Generate deep link for music generation (optionally with pre-filled style).

### `apiLogger.ts`

API request/response logging utilities (existing module).

## Adding New Shared Modules

When creating new shared modules:

1. Create the module file in this directory
2. Export your functions/constants
3. Import in edge functions using relative path: `../_shared/your-module.ts`
4. Document the module in this README
5. Keep modules focused and single-purpose

## Best Practices

- ✅ Use shared modules for configuration that's used in multiple edge functions
- ✅ Keep modules small and focused
- ✅ Document all exported functions
- ✅ Use TypeScript for type safety
- ✅ Handle environment variables gracefully with defaults
- ❌ Don't include business logic (keep that in edge functions)
- ❌ Don't create circular dependencies between shared modules
- ❌ Don't access Supabase client directly (pass it as parameter if needed)

## File Structure

```
_shared/
├── README.md              # This file
├── apiLogger.ts           # API logging utilities
└── telegram-config.ts     # Telegram bot configuration
```
