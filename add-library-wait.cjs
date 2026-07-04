const fs = require("fs");
const content = fs.readFileSync("tests/e2e/library.spec.ts", "utf8");

const waitForSelectorBlock = `
    // Wait for library data to load
    await page.waitForSelector(
      "[class*='Library'], [class*='library'], [class*='TrackCard'], [class*='track-card'], [data-testid*='track']",
      { timeout: 10000, state: 'attached' }
    ).catch(() => {
      console.log('No library content found, checking for empty state');
    });

    await page.waitForTimeout(500);`;

// Pattern to find and replace: closing of waitForFunction followed by closing of beforeEach
// We need to add the waitForSelector after the waitForFunction but before the beforeEach closes
const pattern = /(\s+\);\n\s+}\);\n)(?=\s+test\.|$)/g;

let replacementCount = 0;
const result = content.replace(pattern, (match, p1, offset, string) => {
  // Check if we're in a context that has /library navigation recently
  const beforeMatch = string.substring(Math.max(0, offset - 500), offset);
  if (beforeMatch.includes("/library") && !beforeMatch.includes("waitForSelector")) {
    replacementCount++;
    return waitForSelectorBlock + "\n" + p1;
  }
  return match;
});

if (replacementCount > 0) {
  fs.writeFileSync("tests/e2e/library.spec.ts", result);
  console.log(`Added waitForSelector logic in ${replacementCount} places`);
} else {
  console.log("No changes made - pattern not found");
}
