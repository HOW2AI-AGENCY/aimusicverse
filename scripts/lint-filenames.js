#!/usr/bin/env node

/**
 * Lint script to enforce kebab-case file naming convention
 * for all source files in the project.
 *
 * Per constitution naming standards:
 * - Component files: kebab-case (e.g., track-card.tsx)
 * - Hook files: camelCase with use- prefix (e.g., use-track-data.ts)
 * - All other source files: kebab-case (e.g., track-service.ts)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC_DIR = 'src';
const IGNORE_PATTERNS = [
  // Vendor and third-party
  'node_modules',
  // Build outputs
  'dist',
  'build',
  '.next',
  // Test coverage
  'coverage',
  // Storybook
  '.storybook',
  'storybook-static',
  // IDE
  '.vscode',
  '.idea',
  // Config files that are allowed to be PascalCase or special formats
  'vite.config.ts',
  'tailwind.config.js',
  'jest.config.js',
  'playwright.config.ts',
  // Specific allowed files
  'setupTests.ts',
  'vitest.setup.ts',
];

// Patterns for allowed file names
const PATTERNS = {
  // kebab-case.ts or kebab-case.api.ts or kebab-case.service.ts (allows .api., .service., etc. suffixes)
  kebabCase: /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(\.(api|service|types|util|utils|controller|model|dto))?\.tsx?$/,
  // useSomething.ts or useSomething.ts (camelCase with use- prefix for directory structure)
  hookDir: /^use-[a-z][a-zA-Z0-9]*\.ts$/,
  // Allow test files
  testFile: /\.test\.(ts|tsx|js|jsx)$|\.spec\.(ts|tsx|js|jsx)$/,
  // Allow .d.ts type definition files
  typeDef: /\.d\.ts$/,
  // Special index files
  indexFile: /^index\.(ts|tsx|js|jsx)$/,
};

const violations = [];
const checkedFiles = [];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function checkFileName(filePath, rootDir) {
  if (shouldIgnore(filePath)) {
    return;
  }

  // Handle both forward and backward slashes for cross-platform compatibility
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = normalizedPath.split('/').pop();

  // Skip .d.ts type definition files
  if (PATTERNS.typeDef.test(fileName)) {
    checkedFiles.push(filePath);
    return;
  }

  // Skip index files
  if (PATTERNS.indexFile.test(fileName)) {
    checkedFiles.push(filePath);
    return;
  }

  // Skip test files (they follow their own convention)
  if (PATTERNS.testFile.test(fileName)) {
    checkedFiles.push(filePath);
    return;
  }

  // Check if it matches kebab-case pattern (allows single words like "track.ts" or "admin.api.ts")
  if (PATTERNS.kebabCase.test(fileName)) {
    checkedFiles.push(filePath);
    return;
  }

  // Check if it's a hook file in hooks directory (use- prefix pattern)
  if (normalizedPath.includes('/hooks/') && PATTERNS.hookDir.test(fileName)) {
    checkedFiles.push(filePath);
    return;
  }

  // If we get here, it's a violation
  violations.push({
    file: filePath,
    issue: 'File name must use kebab-case (e.g., track-card.tsx, admin.api.ts) or for hooks: use-hook-name.ts',
  });
}

function walkDirectory(dir, rootDir) {
  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const relativePath = relative(rootDir, filePath);
      const stats = statSync(filePath);

      if (stats.isDirectory()) {
        walkDirectory(filePath, rootDir);
      } else if (stats.isFile() && /\.(ts|tsx|js|jsx)$/.test(file)) {
        checkFileName(relativePath, rootDir);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
}

// Main execution
const srcPath = join(process.cwd(), SRC_DIR);

if (statSync(srcPath).isDirectory()) {
  walkDirectory(srcPath, process.cwd());
}

// Report results
console.log(`\n🔍 Checked ${checkedFiles.length} files for naming conventions\n`);

if (violations.length > 0) {
  console.error(`❌ Found ${violations.length} file naming violations:\n`);

  violations.forEach(({ file, issue }) => {
    console.error(`  ${file}`);
    console.error(`    → ${issue}\n`);
  });

  console.error('\nExpected naming conventions:');
  console.error('  Components: track-card.tsx, mobile-header-bar.tsx');
  console.error('  Hooks:      use-track-data.ts, use-player-state.ts');
  console.error('  Utils:      format-date.ts, audio-utils.ts');
  console.error('  Tests:      track-card.test.tsx, use-data.spec.ts\n');

  process.exit(1);
} else {
  console.log('✅ All files follow kebab-case naming convention!\n');
  process.exit(0);
}
