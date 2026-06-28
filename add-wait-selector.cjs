const fs = require('fs');
let content = fs.readFileSync('tests/e2e/library.spec.ts', 'utf8');

// Find the first beforeEach block and add waitForSelector after it
const beforeEachPattern = /(test\.beforeEach\(async \(\{[^}]+\}\) => \{[^}]+\}\));\s*\n\s*\}\);/g;

const replacement = `$1

    // Wait for library data to load
    await page.waitForSelector(
      "[class*='Library'], [class*='library'], [class*='TrackCard'], [class*='track-card'], [data-testid*='track']",
      { timeout: 10000, state: 'attached' }
    ).catch(() => {
      console.log('No library content found, checking for empty state');
    });

    await page.waitForTimeout(500);
  });`;

content = content.replace(/test\.beforeEach\(async \(\{\s*page\s*\}\) => \{\n\s*await page\.goto\("/library", \{ waitUntil: "networkidle" \}\);\n\n\s*\/\/ Wait for app to be ready\n\s*await page\.waitForFunction\(\n\s*\(\) => \{\n\s*const root = document\.getElementById\("root"\);\n\s*if \(!root\) return false;\n\s*const fallback = document\.getElementById\("loading-fallback"\);\n\s*const hasReal =\n\s*root\.querySelector\("main, \[role='main'\], nav, \[role='navigation'\], \[data-testid\]"\) != null;\n\s*return !fallback \|\| hasReal;\n\s*\},\n\s*\{ timeout: 20000 \},\n\s*\);\n\s*\}\);/g, 
`test.beforeEach(async ({ page }) => {
    await page.goto("/library", { waitUntil: "networkidle" });

    // Wait for app to be ready
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        if (!root) return false;
        const fallback = document.getElementById("loading-fallback");
        const hasReal =
          root.querySelector("main, [role='main'], nav, [role='navigation'], [data-testid]") != null;
        return !fallback || hasReal;
      },
      { timeout: 20000 },
    );

    // Wait for library data to load
    await page.waitForSelector(
      "[class*='Library'], [class*='library'], [class*='TrackCard'], [class*='track-card'], [data-testid*='track']",
      { timeout: 10000, state: 'attached' }
    ).catch(() => {
      console.log('No library content found, checking for empty state');
    });

    await page.waitForTimeout(500);
  });`);

fs.writeFileSync('tests/e2e/library.spec.ts', content);
console.log('Added waitForSelector logic');