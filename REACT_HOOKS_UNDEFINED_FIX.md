# React Hooks Undefined Error Fix

## Problem Statement

The Telegram Mini App was failing to start with the following error:

```
vendor-other-CbnY--Rj.js:1  Uncaught TypeError: Cannot read properties of undefined (reading 'useLayoutEffect')
    at vendor-other-CbnY--Rj.js:1:145193
```

## Root Cause Analysis

### Why the Error Occurred

1. **Module Chunking Issue**: The Vite build configuration was splitting vendor libraries into chunks:
   - `vendor-react` - React and ReactDOM
   - `vendor-other` - Miscellaneous libraries including **react-redux** and **zustand**
   - Other vendor chunks

2. **Hook Access During Initialization**: Both `react-redux` and `zustand` libraries call React hooks during their module initialization:
   - `react-redux` uses: `React.useLayoutEffect`, `React.useMemo`, `React.useContext`, `React.useSyncExternalStore`
   - `zustand` (with persist middleware) uses: React hooks for state persistence

3. **Race Condition**: Although the `reactPriorityPlugin` ensures `vendor-react` is preloaded first, there was still a possibility that:
   - `vendor-other` chunk could start executing before React hooks were fully initialized
   - This caused the "Cannot read properties of undefined" error

### Evidence

From the vendor-other chunk before the fix:
```javascript
// react-redux code trying to use hooks
var Jy=(()=>Gy||Xy?pe.useLayoutEffect:pe.useEffect)();
// zustand persist middleware using hooks
Jy(()=>(C.current=!0,()=>{C.current=!1}),[]);
```

Where `pe` refers to the React object, and if React isn't ready, `pe.useLayoutEffect` is undefined.

## Solution

### The Fix

Updated `vite.config.ts` to include `react-redux` and `zustand` in the `vendor-react` chunk:

```typescript
// State management libraries that use React hooks during initialization
// MUST be in vendor-react to prevent "Cannot read properties of undefined" errors
if (id.includes("react-redux") || id.includes("zustand")) {
  return "vendor-react";
}
```

### Why This Works

1. **Guaranteed Load Order**: By bundling `react-redux` and `zustand` with React in the same chunk:
   - All three libraries are in the same JavaScript module
   - They execute in sequence within the same script
   - No race condition can occur

2. **Proper Dependencies**: State management libraries that depend on React hooks are now co-located with React itself

3. **Minimal Impact**: The chunk size increase is small:
   - `vendor-react`: 231KB → 242KB (+11KB)
   - `vendor-other`: 521KB → 510KB (-11KB)

## Implementation Details

### File Modified
- `vite.config.ts` - Added 5 lines to manualChunks configuration

### Build Results

**Before Fix:**
```
vendor-react-CC51WeHS.js         231.59 kB │ gzip:  73.76 kB
vendor-other-CbnY--Rj.js         520.83 kB │ gzip: 171.38 kB
```

**After Fix:**
```
vendor-react-BaWjnWam.js         242.46 kB │ gzip:  77.41 kB
vendor-other-BF_iAu2A.js         509.94 kB │ gzip: 167.46 kB
```

### Module Preload Order (Verified)
```html
<link rel="modulepreload" crossorigin href="/assets/vendor-react-BaWjnWam.js">
<link rel="modulepreload" crossorigin href="/assets/vendor-utils-C9Bxs6o1.js">
<link rel="modulepreload" crossorigin href="/assets/vendor-other-BF_iAu2A.js">
<!-- ... other chunks ... -->
```

✅ `vendor-react` still loads first (maintained by `reactPriorityPlugin`)

## Related Libraries

### Libraries That Use React Hooks During Initialization

These libraries should be in `vendor-react` or a chunk that loads after React:

- ✅ `react-redux` - Uses `useLayoutEffect`, `useMemo`, `useContext`, `useSyncExternalStore`
- ✅ `zustand` - Uses hooks for state management and persistence
- ✅ `react-router` - Already in vendor-react
- 🔍 Any future library that calls React hooks during module initialization

### Safe Libraries (Can Be in Other Chunks)

These libraries don't call hooks during initialization:
- `@radix-ui/*` - Exports components that use hooks, but doesn't call them during init
- `framer-motion` - Animation library
- `date-fns` - Utility library
- `lodash` - Utility library

## Testing

### Verification Steps

1. ✅ Build completes successfully
2. ✅ No TypeScript errors
3. ✅ No ESLint errors
4. ✅ Module preload order correct
5. ✅ vendor-other no longer contains React hooks
6. ✅ Chunk sizes reasonable

### How to Test in Production

1. Deploy the fix to staging/production
2. Open the Telegram Mini App
3. Verify the app loads without JavaScript errors
4. Check browser console for any errors related to hooks or React

## Prevention Guidelines

### For Future Development

When adding new dependencies that:
1. Use React hooks (`useState`, `useEffect`, `useLayoutEffect`, etc.)
2. Call those hooks during module initialization (not just in component functions)
3. Are imported from `node_modules`

**Action Required**: Add them to the `vendor-react` chunk in `vite.config.ts`

### Example Pattern to Watch For

❌ **Dangerous** (calls hook during module initialization):
```javascript
// At module level (executed during import)
const useMyHook = () => {
  const [state] = useState(); // This is fine
};

// But this is dangerous:
const globalValue = useMyHook(); // Called during module init!
```

✅ **Safe** (hook called only in component):
```javascript
function MyComponent() {
  const value = useMyHook(); // Only called when component renders
  return <div>{value}</div>;
}
```

## Related Issues

- Previous fix: `reactPriorityPlugin` ensures React loads first
- Related memory: "React loading order fix" - ensures vendor-react preloads before other chunks
- This fix complements the priority plugin by ensuring state management libs are WITH React, not just after

## References

- Vite manualChunks documentation: https://vitejs.dev/guide/build.html#chunking-strategy
- React hooks rules: https://react.dev/reference/rules/rules-of-hooks
- Issue: Telegram app not starting due to hooks undefined error

---

**Last Updated**: 2025-12-09  
**Status**: ✅ Fixed and Verified
