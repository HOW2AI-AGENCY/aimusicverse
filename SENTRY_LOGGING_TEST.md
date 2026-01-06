# Sentry Logging Verification Tests

This file contains test code to verify that Sentry logging is working correctly.

## Quick Verification

Add this code temporarily to any component or run in the browser console:

```typescript
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';

// Test 1: Basic structured logging
logger.info('Test: User logged in', { userId: 'test-123', method: 'oauth' });

// Test 2: Warning log
logger.warn('Test: Rate limit approaching', { currentRate: 95, limit: 100 });

// Test 3: Error log
logger.error('Test: API call failed', new Error('Test error'), { endpoint: '/api/tracks' });

// Test 4: Direct Sentry logger
Sentry.logger.info('Direct Sentry test', { test: true, timestamp: new Date().toISOString() });

// Test 5: All log levels
Sentry.logger.trace('Trace message');
Sentry.logger.debug('Debug message');
Sentry.logger.info('Info message');
Sentry.logger.warn('Warning message');
Sentry.logger.error('Error message');
Sentry.logger.fatal('Fatal message');

// Test 6: Template literal formatting
Sentry.logger.info(
  Sentry.logger.fmt`User '${'test_user'}' performed '${'login'}' action`
);

// Test 7: Console capture (should capture warn/error)
console.warn('This console.warn should be captured');
console.error('This console.error should be captured');
```

## Expected Behavior

1. **Development Mode:**
   - All logs appear in browser console
   - No logs sent to Sentry (to avoid cluttering dev data)

2. **Production Mode:**
   - `logger.info()` and `logger.debug()` only appear in console (not Sentry)
   - `logger.warn()` and `logger.error()` appear in console AND Sentry
   - Console `warn()` and `error()` are captured by Sentry console integration
   - Direct `Sentry.logger.*` calls send logs to Sentry

## How to Verify

1. **Run in production mode:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Open browser and run the test code above**

3. **Check Sentry Dashboard:**
   - Go to your Sentry project
   - Navigate to **Logs** section (not Issues)
   - Filter by `environment:production`
   - You should see the test logs appearing within 1-2 minutes

4. **Verify log attributes:**
   - Click on any log to see its details
   - Check that structured data (userId, endpoint, etc.) appears as searchable attributes

## Troubleshooting

### Logs not appearing in Sentry

1. **Check DSN is configured:**
   ```typescript
   // Should be true
   import { isSentryEnabled } from '@/lib/sentry';
   console.log('Sentry enabled:', isSentryEnabled);
   ```

2. **Check environment:**
   - Logs only sent to Sentry in production (not development)
   - Verify `import.meta.env.MODE === 'production'`

3. **Check browser console:**
   - Look for `[Sentry]` messages indicating initialization
   - Check for any error messages from Sentry

4. **Check network tab:**
   - Look for requests to `ingest.de.sentry.io`
   - Verify requests are successful (200 status)

### Too many logs

Adjust the log filtering in [sentry.ts](src/lib/sentry.ts:63-84):

```typescript
beforeSendLog(log) {
  // Add more filters here
  if (log.category?.includes('noisy-module')) {
    return null; // Drop these logs
  }
  return log;
}
```

### Console logs not being captured

Verify console integration is enabled in [sentry.ts](src/lib/sentry.ts:41-43):

```typescript
Sentry.consoleLoggingIntegration({
  levels: ['warn', 'error'], // Should include desired levels
}),
```

## Production Log Levels

| Logger Method | Console Output | Sentry Output (Production) |
|--------------|----------------|----------------------------|
| `debug()`    | Yes (dev only) | Yes                        |
| `info()`     | Yes (dev only) | Yes                        |
| `warn()`     | Yes            | Yes                        |
| `error()`    | Yes            | Yes (as both error & log)   |

## Next Steps

Once verified, you can:

1. **Remove test code** from your components
2. **Adjust sampling rates** if needed (currently 10% for traces)
3. **Add custom attributes** to logs for better filtering
4. **Set up alerts** in Sentry for specific log patterns
