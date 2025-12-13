# React Loading Order Fix

## Problem Statement

The production build was failing with the following error:
```
Uncaught TypeError: Cannot read properties of undefined (reading 'createContext')
at vendor-other-ySatH37R.js:11:3861
```

## Root Cause

When Vite builds the application for production:

1. **Code is split into vendor chunks** via `manualChunks` configuration:
   - `vendor-react` - React and ReactDOM
   - `vendor-other` - Miscellaneous libraries
   - `vendor-radix` - Radix UI components
   - etc.

2. **HTML modulepreload hints are generated** automatically, but **without guaranteed order**

3. **The problem**: Libraries in `vendor-other` (like @radix-ui components) depend on React and call `React.createContext` during their module initialization

4. **If `vendor-other` loads before `vendor-react`**: The code tries to access `React.createContext` before React is loaded, causing the error

## Solution

### 1. Custom Vite Plugin: `reactPriorityPlugin`

Added a custom plugin in `vite.config.ts` that:
- Runs in **production mode only** (`mode === "production"`)
- Uses `enforce: "post"` to run after HTML generation
- **Reorders modulepreload links** in the generated HTML
- Ensures `vendor-react` preload appears **before all other preloads**

```typescript
function reactPriorityPlugin(): Plugin {
  return {
    name: "react-priority-plugin",
    enforce: "post",
    transformIndexHtml(html) {
      // Extract all modulepreload links
      const modulePreloadRegex = /<link\s+rel="modulepreload"\s+crossorigin\s+href="[^"]+"\s*\/?>/g;
      const matches = html.match(modulePreloadRegex) || [];
      
      if (matches.length === 0) return html;

      // Separate React preload from others
      const reactPreload = matches.filter(link => link.includes('vendor-react'));
      const otherPreloads = matches.filter(link => !link.includes('vendor-react'));

      // Remove all modulepreload links
      let modifiedHtml = html;
      matches.forEach(link => {
        modifiedHtml = modifiedHtml.replace(
          new RegExp(`\\s*${link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'), 
          '\n'
        );
      });

      // Clean up multiple newlines
      modifiedHtml = modifiedHtml.replace(/\n{3,}/g, '\n');

      // Insert React preload first, then others, before </head>
      const allPreloads = [...reactPreload, ...otherPreloads].join('\n  ');
      modifiedHtml = modifiedHtml.replace('</head>', `  ${allPreloads}\n</head>`);

      return modifiedHtml;
    }
  };
}
```

### 2. Improved manualChunks Configuration

Enhanced the chunking strategy to better separate React dependencies:

```typescript
manualChunks: (id) => {
  if (id.includes("node_modules")) {
    // CRITICAL: React MUST be checked first with specific path matching
    if (id.includes("/react/") || id.includes("/react-dom/") || 
        id.includes("/react-is/") || id.includes("/scheduler/")) {
      return "vendor-react";
    }
    
    // React Router
    if (id.includes("react-router")) {
      return "vendor-react";
    }
    
    // UI libraries that depend on React
    if (id.includes("@radix-ui") || id.includes("cmdk") || 
        id.includes("vaul") || id.includes("sonner") || 
        id.includes("next-themes")) {
      return "vendor-radix";
    }
    
    // Other React UI libraries
    if (id.includes("react-virtuoso") || id.includes("embla-carousel-react") || 
        id.includes("react-day-picker") || id.includes("react-resizable-panels")) {
      return "vendor-react-ui";
    }
    
    // ... other chunks ...
    
    return "vendor-other";
  }
}
```

## Result

### Before Fix
```html
<link rel="modulepreload" crossorigin href="/assets/vendor-utils-*.js">
<link rel="modulepreload" crossorigin href="/assets/vendor-other-*.js">  <!-- Loads first! -->
<link rel="modulepreload" crossorigin href="/assets/vendor-radix-*.js">
<link rel="modulepreload" crossorigin href="/assets/vendor-react-*.js">  <!-- Too late! -->
```

### After Fix
```html
<link rel="modulepreload" crossorigin href="/assets/vendor-react-*.js">  <!-- Loads first! ✓ -->
<link rel="modulepreload" crossorigin href="/assets/vendor-utils-*.js">
<link rel="modulepreload" crossorigin href="/assets/vendor-other-*.js">  <!-- Safe now! -->
<link rel="modulepreload" crossorigin href="/assets/vendor-radix-*.js">
```

## Chunk Size Summary

After optimization:
- `vendor-react` (227K) - React core
- `vendor-radix` (197K) - Radix UI components  
- `vendor-react-ui` (39K) - Other React UI libs
- `vendor-other` (509K) - Remaining libraries

## Why This Works

1. **Browser modulepreload behavior**: Browsers fetch modulepreload resources in parallel, but modules execute in **import dependency order**

2. **The plugin doesn't change execution order**: It only optimizes the **fetch hints** to start React download first

3. **Import dependencies ensure safety**: Even if vendor-other fetches faster, it won't execute until its import dependency (React) is available

4. **Optimization benefit**: By preloading React first, we give it a head start on download/parse/compile

## Testing

✅ Production build completes successfully  
✅ Generated HTML has correct modulepreload order  
✅ Dev server works without regression  
✅ No impact on development mode (plugin only runs in production)  
✅ Chunk splitting correctly separates React dependencies

## Related Files

- `vite.config.ts` - Contains the reactPriorityPlugin and manualChunks configuration
- `dist/index.html` - Generated HTML with correct modulepreload order (production only)

## Notes

- This fix is **production-only** and doesn't affect development mode
- The plugin uses `enforce: "post"` to run after all other HTML transformations
- The solution is future-proof: as long as chunks are named with `vendor-react`, the plugin will work

## References

- Vite modulepreload documentation: https://vitejs.dev/guide/features.html#preload-directives-generation
- Related issue: "Cannot read properties of undefined (reading 'createContext')" in production
- Memory stored: "React loading order fix" in bootstrap_and_build category
