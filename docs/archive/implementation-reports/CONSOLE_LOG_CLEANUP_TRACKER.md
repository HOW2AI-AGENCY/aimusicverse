# Console.log Cleanup Progress Tracker

**Last Updated:** 2025-12-12  
**Status:** ⚠️ 71 files remaining (2 completed)  
**Total Console Calls:** 544 across 71 files

## Quick Start

Use the automated script to find and fix console.log calls:

```bash
# List all files with console.* calls
./scripts/find-console-logs.sh

# Get fix instructions for a specific file
./scripts/find-console-logs.sh --fix-file supabase/functions/klangio-analyze/index.ts
```

## Progress Summary

### ✅ Completed (2 files)
- `telegram-auth/index.ts` - 9 calls replaced ✅
- All `stars-*` payment functions already use logger ✅

### 🔴 High Priority (Top 10 by count)
Files with the most console.* calls that should be fixed first:

| Count | File | Priority | Notes |
|-------|------|----------|-------|
| 54 | `klangio-analyze/index.ts` | 🔴 Critical | Music transcription - high volume |
| 28 | `sync-stale-tasks/index.ts` | 🔴 High | Background job - runs frequently |
| 25 | `suno-check-status/index.ts` | 🔴 High | Status polling - high volume |
| 17 | `suno-video-callback/index.ts` | 🟡 Medium | Webhook handler |
| 17 | `suno-add-vocals/index.ts` | 🟡 Medium | Audio processing |
| 17 | `suno-add-instrumental/index.ts` | 🟡 Medium | Audio processing |
| 16 | `transcribe-midi/index.ts` | 🟡 Medium | MIDI processing |
| 15 | `suno-send-audio/index.ts` | 🟡 Medium | Telegram integration |
| 14 | `suno-vocal-callback/index.ts` | 🟡 Medium | Webhook handler |
| 14 | `suno-cover-callback/index.ts` | 🟡 Medium | Webhook handler |

### 🟢 Medium Priority (11-50 files)
All remaining edge functions with <14 console calls

### Files by Category

**Music Generation (Suno):** 15 files, 180+ calls
- suno-check-status (25), suno-video-callback (17), suno-vocal-callback (14), etc.

**Audio Processing:** 8 files, 90+ calls
- klangio-analyze (54), transcribe-midi (16), detect-beats (5), etc.

**Background Jobs:** 5 files, 60+ calls
- sync-stale-tasks (28), cleanup-orphaned-data (12), retry-failed-tasks (12), etc.

**Telegram Bot:** 12 files, 80+ calls
- telegram-api.ts (13), music.ts (10), generate.ts (8), etc.

**Utilities:** 31 files, 134+ calls
- Various helper functions, webhooks, and API integrations

## Replacement Pattern

### Before (Console)
```typescript
console.log('Processing request', requestId);
console.error('Failed to process:', error);
console.warn('Rate limit approaching:', { remaining: 5 });
```

### After (Structured Logger)
```typescript
logger.info('Processing request', { requestId });
logger.error('Failed to process', { error: error.message, requestId });
logger.warn('Rate limit approaching', { remaining: 5 });
```

### Adding Logger to a File

1. **Import logger:**
```typescript
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('function-name');
```

2. **Replace calls:**
```bash
sed -i 's/console\.log/logger.info/g' file.ts
sed -i 's/console\.error/logger.error/g' file.ts
sed -i 's/console\.warn/logger.warn/g' file.ts
```

3. **Convert to structured format:**
```typescript
// BEFORE
console.log('User:', userId, 'Action:', action);

// AFTER (structured)
logger.info('User action', { userId, action });
```

## Sensitive Data Checklist

When replacing console.* calls, ensure you DON'T log:

❌ **Never Log:**
- Passwords
- API keys / tokens
- Full credit card numbers
- Telegram bot tokens
- Session cookies

⚠️ **Be Careful With:**
- User emails (consider hashing)
- Telegram IDs (only in secure context)
- Payment amounts (aggregate only)
- Personal user data

✅ **Safe to Log:**
- Request IDs
- Status codes
- Transaction IDs (UUIDs)
- Aggregated metrics
- Public data

## Automated Cleanup Workflow

### Step 1: Identify Target Files
```bash
./scripts/find-console-logs.sh > console-cleanup-report.txt
```

### Step 2: Fix High-Priority Files
Focus on files with 15+ console calls:
```bash
# Get fix instructions
./scripts/find-console-logs.sh --fix-file supabase/functions/klangio-analyze/index.ts

# Apply fixes (review first!)
sed -i 's/console\.log/logger.info/g' supabase/functions/klangio-analyze/index.ts
sed -i 's/console\.error/logger.error/g' supabase/functions/klangio-analyze/index.ts
```

### Step 3: Convert to Structured Format
Manually review and convert:
```typescript
// String concatenation → Object
console.log('Processing:', id, 'Status:', status)
// becomes
logger.info('Processing task', { id, status })
```

### Step 4: Test
Deploy and monitor logs:
```bash
# Deploy function
git add supabase/functions/klangio-analyze/
git commit -m "Replace console.log with structured logging in klangio-analyze"
git push

# Monitor logs in Supabase dashboard
# Check for errors and verify logging works
```

## Sprint Planning

### Week 1: Critical Functions (54 + 28 + 25 = 107 calls)
- [ ] klangio-analyze/index.ts (54 calls)
- [ ] sync-stale-tasks/index.ts (28 calls)
- [ ] suno-check-status/index.ts (25 calls)

**Effort:** ~4 hours (testing + review)

### Week 2: High-Volume Functions (17×3 + 16 + 15 = 82 calls)
- [ ] suno-video-callback/index.ts (17 calls)
- [ ] suno-add-vocals/index.ts (17 calls)
- [ ] suno-add-instrumental/index.ts (17 calls)
- [ ] transcribe-midi/index.ts (16 calls)
- [ ] suno-send-audio/index.ts (15 calls)

**Effort:** ~3 hours

### Week 3: Webhook & Background (14×3 + 12×3 = 78 calls)
- [ ] suno-vocal-callback/index.ts (14 calls)
- [ ] suno-cover-callback/index.ts (14 calls)
- [ ] generate-track-cover/index.ts (14 calls)
- [ ] cleanup-orphaned-data/index.ts (12 calls)
- [ ] retry-failed-tasks/index.ts (12 calls)
- [ ] reward-action/index.ts (12 calls)

**Effort:** ~3 hours

### Week 4: Telegram Bot (80 calls across 12 files)
- [ ] telegram-api.ts (13 calls)
- [ ] music.ts (10 calls)
- [ ] generate.ts (8 calls)
- [ ] Others (49 calls)

**Effort:** ~3 hours

### Weeks 5-6: Remaining Functions (197 calls across 41 files)
- [ ] All remaining edge functions
- [ ] Final review and testing

**Effort:** ~6 hours

**Total Effort Estimate:** 19-20 hours across 6 weeks

## Enforcement (Future)

To prevent new console.* calls from being added:

### ESLint Rule
Add to `eslint.config.js`:
```javascript
rules: {
  'no-console': ['error', { allow: ['warn', 'error'] }],
  // Or stricter:
  'no-console': 'error'
}
```

### Pre-commit Hook
Add to `.husky/pre-commit`:
```bash
# Check for console.* in staged files
if git diff --cached --name-only | grep -E '\.(ts|js)$' | xargs grep -l 'console\.' 2>/dev/null; then
  echo "❌ Error: console.* calls found in staged files"
  echo "   Use logger.info/warn/error instead"
  exit 1
fi
```

### CI/CD Check
Add to GitHub Actions:
```yaml
- name: Check for console.log
  run: |
    if grep -r "console\." supabase/functions --include="*.ts" --exclude-dir=node_modules; then
      echo "::error::console.* calls found in production code"
      exit 1
    fi
```

## Metrics

Track progress with these queries:

```bash
# Total files with console.*
find supabase/functions -name "*.ts" -exec grep -l "console\." {} \; | wc -l

# Total console.* calls
grep -r "console\." supabase/functions --include="*.ts" | wc -l

# Files by priority (most calls first)
for f in $(find supabase/functions -name "*.ts"); do 
  count=$(grep -c "console\." "$f" 2>/dev/null || echo 0)
  if [ "$count" -gt 0 ]; then 
    echo "$count - $f"
  fi
done | sort -rn
```

## References

- **Logger Implementation:** `supabase/functions/_shared/logger.ts`
- **Example Migration:** `supabase/functions/telegram-auth/index.ts` (completed)
- **Script:** `scripts/find-console-logs.sh`
- **Documentation:** `CRITICAL_FIXES_TELEGRAM_INTEGRATION.md`

## Questions?

- How to structure complex log messages?
  → Use nested objects: `logger.info('Operation', { user: { id, name }, action, result })`

- What log level to use?
  → `info` = normal flow, `warn` = recoverable issues, `error` = failures

- How to log errors?
  → `logger.error('Failed', { error: error.message, stack: error.stack, context })`

- Performance impact?
  → Minimal. Logger is optimized and only active when needed.

---

**Next Action:** Start with klangio-analyze (54 calls) - highest impact file
