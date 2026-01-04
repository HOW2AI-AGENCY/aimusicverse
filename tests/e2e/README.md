# E2E Browser Tests

Comprehensive browser tests for MusicVerse AI infrastructure using Playwright.

## Overview

These tests verify cross-browser compatibility and functionality for:
- **Storage Infrastructure** (`storage.spec.ts`) - Upload, download, quota management
- **CDN Integration** (`cdn.spec.ts`) - Image optimization, responsive images
- **Browser Compatibility** (`browser-compatibility.spec.ts`) - Core web APIs and features

## Browser Coverage

Tests run across multiple browsers and devices:
- ✅ **Chromium** (Desktop Chrome)
- ✅ **Firefox** (Desktop Firefox)
- ✅ **WebKit** (Desktop Safari)
- ✅ **Mobile Chrome** (Pixel 5)
- ✅ **Mobile Safari** (iPhone 12)
- ✅ **Microsoft Edge**
- ✅ **Google Chrome** (branded)

## Running Tests

### All Browsers
```bash
# Run all tests across all browsers
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui
```

### Specific Browsers
```bash
# Chromium only
npm run test:e2e:chromium

# Firefox only
npm run test:e2e:firefox

# WebKit (Safari) only
npm run test:e2e:webkit

# Mobile browsers only
npm run test:e2e:mobile
```

### Development
```bash
# Run tests in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

## Test Files

### `storage.spec.ts`
Tests storage infrastructure helper functions:
- Module loading
- Byte formatting across browsers
- Storage buckets configuration
- File API compatibility
- Upload error handling
- Cross-browser consistency
- Responsive viewport handling

**Key Tests:**
- ✅ Storage module loads without errors
- ✅ formatBytes() works identically across browsers
- ✅ All 7 storage buckets configured correctly
- ✅ File API supported in all browsers
- ✅ Error handling works gracefully
- ✅ Consistent behavior across viewport sizes

### `cdn.spec.ts`
Tests CDN integration helper functions:
- CDN module loading
- CDN providers configuration
- Image URL generation
- Responsive srcsets
- Thumbnail generation
- Blur placeholders
- Performance benchmarks

**Key Tests:**
- ✅ CDN module loads without errors
- ✅ Optimized image URLs generated
- ✅ Responsive srcsets with multiple sizes
- ✅ Thumbnails at different sizes
- ✅ Blur placeholders for lazy loading
- ✅ IntersectionObserver support
- ✅ Fast URL generation (<1ms per URL)

### `browser-compatibility.spec.ts`
Comprehensive browser feature tests:
- Core Web APIs
- ES6+ features
- Dynamic imports
- Media APIs (image/audio)
- Storage & network
- Responsive design
- Performance APIs

**Key Tests:**
- ✅ localStorage, fetch, Promise support
- ✅ ES6 features (arrow functions, async/await, classes)
- ✅ Dynamic imports work
- ✅ Image format support (PNG, JPEG, WebP)
- ✅ Audio APIs available
- ✅ localStorage operations
- ✅ Fetch API
- ✅ Media queries
- ✅ Performance measurement

## Test Structure

```
tests/
└── e2e/
    ├── README.md                      # This file
    ├── storage.spec.ts                # Storage infrastructure tests
    ├── cdn.spec.ts                    # CDN integration tests
    └── browser-compatibility.spec.ts   # Browser feature tests
```

## Configuration

Playwright configuration in `playwright.config.ts`:
- Base URL: `http://localhost:5173`
- Parallel execution: enabled
- Retries: 2 on CI, 0 locally
- Reporters: HTML, List, JSON
- Screenshots: on failure
- Video: on failure
- Traces: on first retry

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main/develop branches
- Manual workflow dispatch

### CI Configuration
```yaml
# .github/workflows/playwright.yml
- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm run test:e2e
```

## Test Results

Results are saved to:
- `test-results/` - Test artifacts (screenshots, videos, traces)
- `playwright-report/` - HTML report

View report:
```bash
npm run test:e2e:report
```

## Writing New Tests

### Basic Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page, browserName }) => {
    const result = await page.evaluate(() => {
      // Test code here
      return { success: true };
    });

    expect(result.success).toBe(true);
    console.log(`${browserName}: Test passed`);
  });
});
```

### Best Practices
1. **Use descriptive test names** - Clear, action-oriented
2. **Test across browsers** - Use `browserName` fixture
3. **Handle viewport sizes** - Test responsive behavior
4. **Log important info** - Help debug CI failures
5. **Use waitForLoadState** - Ensure page is ready
6. **Keep tests independent** - No shared state
7. **Test error cases** - Not just happy paths

## Debugging

### Local Debugging
```bash
# Run in headed mode to see browser
npm run test:e2e:headed

# Run specific test file
npx playwright test storage.spec.ts

# Run specific test
npx playwright test -g "should format bytes"

# Debug mode (pause before each command)
npx playwright test --debug
```

### CI Debugging
1. Check test report in CI artifacts
2. Download screenshots/videos from failed tests
3. Review traces with `npx playwright show-trace trace.zip`

## Performance Benchmarks

Expected performance targets:
- Storage module load: <100ms
- CDN URL generation: <1ms per URL
- Byte formatting: <0.1ms per call
- Dynamic imports: <500ms
- Browser API checks: <50ms

## Troubleshooting

### Tests failing in CI but passing locally
- Check browser versions: `npx playwright --version`
- Verify dependencies: `npx playwright install --with-deps`
- Review CI logs for network/timeout issues

### Tests hanging
- Check for missing `await` statements
- Verify page loads completely
- Increase timeout: `test.setTimeout(60000)`

### Browser not found
```bash
# Install browsers
npx playwright install

# Install with system dependencies
npx playwright install --with-deps
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)

## Support

For issues with tests:
1. Check this README
2. Review test logs
3. Check Playwright documentation
4. Create issue in repository

---

**Last Updated**: 2025-12-03  
**Test Coverage**: Storage, CDN, Browser Compatibility  
**Browsers Tested**: 7 configurations (Desktop + Mobile)
