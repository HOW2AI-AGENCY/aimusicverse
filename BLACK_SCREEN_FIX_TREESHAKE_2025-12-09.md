# Black Screen Fix: Vite Tree-Shaking Issue (2025-12-09)

## Problem Statement (Russian)
> изучи мини апп телеграм и найди причину почему приложение зависает на черном экране и не гриузится

**Translation:** Investigate the Telegram mini app and find the reason why the application hangs on a black screen and doesn't load.

## Symptoms

1. **Telegram WebApp initialization appeared normal:**
   - All Telegram WebView events were firing correctly
   - Theme, viewport, and safe area events were received
   - Main and secondary buttons were being set up

2. **App showed only a black screen:**
   - No loading spinner visible
   - No React components rendering
   - Complete application failure

## Root Cause Analysis

### Investigation Process

1. ✅ Checked TelegramContext initialization - Working correctly
2. ✅ Checked InitializationGuard timeouts - Working correctly  
3. ✅ Checked useAuth authentication - Working correctly
4. ✅ Checked CSS for black background issues - Not the issue
5. ✅ **FOUND:** Build process creating empty vendor chunks

### The Critical Issue

**All vendor chunk files were only 1 byte (empty)!**

```bash
# Before fix:
-rw-rw-r-- 1 runner runner    1 Dec  9 13:17 vendor-react-l0sNRNKZ.js
-rw-rw-r-- 1 runner runner    1 Dec  9 13:17 vendor-radix-l0sNRNKZ.js
-rw-rw-r-- 1 runner runner    1 Dec  9 13:17 vendor-supabase-l0sNRNKZ.js
# ... all other vendor files also 1 byte

# After fix:
-rw-rw-r-- 1 runner runner 235K Dec  9 13:18 vendor-react-BBGWFHSu.js
-rw-rw-r-- 1 runner runner 194K Dec  9 13:18 vendor-radix-BQvyumpT.js
-rw-rw-r-- 1 runner runner 161K Dec  9 13:18 vendor-supabase-FMsmSsb7.js
```

### Why This Happened

The `vite.config.ts` file contained an overly aggressive tree-shaking configuration:

```typescript
// INCORRECT - Causes complete code removal
rollupOptions: {
  treeshake: {
    moduleSideEffects: false,  // ← CRITICAL ERROR
    preset: "recommended",
  },
  output: { ... }
}
```

**What `moduleSideEffects: false` does:**
- Tells Rollup that imported modules have NO side effects
- Rollup then assumes the modules can be completely removed if their exports aren't directly used
- In reality, React, ReactDOM, and many libraries REQUIRE their initialization code to run
- This setting caused Rollup to strip out ALL vendor code, leaving only empty 1-byte files

## The Solution

**Remove the overly aggressive tree-shaking configuration:**

```typescript
// CORRECT - Use Vite's safe defaults
rollupOptions: {
  // Removed treeshake configuration entirely
  output: {
    manualChunks: (id) => { ... }
  }
}
```

### Why This Works

1. **Vite's default tree-shaking is already optimized** for React applications
2. **Default tree-shaking is conservative** and preserves necessary module initialization
3. **No need to configure `moduleSideEffects`** unless you have specific requirements
4. **Safer approach** - only removes code that is provably unused

## Files Changed

### `vite.config.ts`
```diff
  rollupOptions: {
-   treeshake: {
-     moduleSideEffects: false,
-     preset: "recommended",
-   },
    output: {
```

**Lines removed:** 95-98

## Verification

### Build Output Comparison

| Chunk | Before (bytes) | After | Status |
|-------|----------------|-------|--------|
| vendor-react | 1 | 235K | ✅ Fixed |
| vendor-radix | 1 | 194K | ✅ Fixed |
| vendor-supabase | 1 | 161K | ✅ Fixed |
| vendor-other | 1 | 554K | ✅ Fixed |
| vendor-framer | 1 | 78K | ✅ Fixed |
| vendor-query | 1 | 36K | ✅ Fixed |
| All other vendors | 1 | Proper sizes | ✅ Fixed |

### Development Server Test

```bash
npm run dev
# ✅ Server starts successfully
# ✅ No console errors
# ✅ App loads correctly in browser
```

### Production Build Test

```bash
npm run build
# ✅ Build completes successfully
# ✅ All chunks have proper sizes
# ✅ No warnings about empty chunks
```

## Lessons Learned

### ⚠️ Critical Configuration Mistakes to Avoid

1. **NEVER use `moduleSideEffects: false` in Vite config** unless you:
   - Fully understand Rollup's tree-shaking behavior
   - Have carefully analyzed your dependency graph
   - Have extensively tested the production build

2. **Trust Vite's defaults** - They are carefully tuned for React apps

3. **Always verify production builds** before deploying:
   ```bash
   npm run build
   ls -lh dist/assets/*.js  # Check file sizes
   ```

4. **Look for warning signs:**
   - Generated chunks showing 0.00 kB in build output
   - Vendor files that are 1 byte in size
   - Black screen with no console errors in production

### 🎯 Best Practices

1. **Use Vite's default tree-shaking** - It's already optimal
2. **Focus on `manualChunks` for code splitting** - Not tree-shaking config
3. **Test production builds locally** before deploying
4. **Monitor chunk sizes** in build output

## Related Issues

This fix resolves the following symptoms:
- ✅ Black screen on Telegram Mini App load
- ✅ No React components rendering
- ✅ Empty vendor chunks in build output
- ✅ Application completely failing to initialize

## Prevention

To prevent this issue in the future:

1. **Add a build verification step** to CI/CD:
   ```bash
   # Fail if any vendor chunk is suspiciously small
   MIN_SIZE=10000  # 10KB minimum
   for file in dist/assets/vendor-*.js; do
     size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
     if [ $size -lt $MIN_SIZE ]; then
       echo "ERROR: $file is too small ($size bytes)"
       exit 1
     fi
   done
   ```

2. **Document the tree-shaking configuration** with clear warnings

3. **Regular production build testing** on staging environment

## Impact

- **Severity:** Critical (P0)
- **User Impact:** Complete application failure
- **Resolution Time:** ~2 hours investigation + 5 minutes fix
- **Affected Versions:** All builds with incorrect tree-shaking config
- **Fix Version:** commit a6b62ef

## References

- [Rollup Tree-Shaking Documentation](https://rollupjs.org/configuration-options/#treeshake-modulesideeffects)
- [Vite Build Options](https://vitejs.dev/config/build-options.html)
- [Previous Black Screen Fix (Timeout System)](BLACK_SCREEN_FIX_SUMMARY_RU.md)

---

**Fixed by:** GitHub Copilot Agent  
**Date:** 2025-12-09  
**Branch:** copilot/fix-black-screen-issue-again  
**Commits:** d64379e (investigation), a6b62ef (fix)
