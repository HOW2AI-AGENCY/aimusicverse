#!/usr/bin/env node

/**
 * Component file migration script
 *
 * Migrates PascalCase component filenames to kebab-case per constitution standards.
 * This is a helper script for the naming convention migration phase.
 *
 * Per constitution:
 * - Component files: kebab-case (e.g., track-card.tsx)
 * - Export names: PascalCase (e.g., export function TrackCard)
 * - Hooks: camelCase with use- prefix (e.g., use-track-data.ts)
 */

import { readFileSync, writeFileSync, renameSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SRC_DIR = join(process.cwd(), 'src');
const DRY_RUN = process.argv.includes('--dry-run');

// PascalCase to kebab-case conversion
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// Check if a filename is PascalCase
function isPascalCase(str) {
  return /^[A-Z][a-zA-Z0-9]*\.(ts|tsx|js|jsx)$/.test(str);
}

// Get all files that need migration
function getFilesToMigrate(dir, baseDir = dir) {
  const files = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...getFilesToMigrate(fullPath, baseDir));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        // Check if filename is PascalCase (excluding allowed files)
        if (
          isPascalCase(entry.name) &&
          entry.name !== 'App.tsx' &&
          !entry.name.startsWith('vite-env') &&
          !entry.name.endsWith('.test.tsx') &&
          !entry.name.endsWith('.spec.tsx')
        ) {
          const relativePath = fullPath.replace(baseDir + '/', '');
          files.push({
            original: fullPath,
            relative: relativePath,
            name: entry.name,
          });
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return files;
}

// Update import statements in a file
function updateImports(content, oldPath, newPath) {
  const oldName = basename(oldPath, '.tsx').replace('.ts', '');
  const newName = basename(newPath, '.tsx').replace('.ts', '');
  const oldDir = dirname(oldPath);
  const newDir = dirname(newPath);

  // This is a simplified version - a real implementation would need to:
  // 1. Parse the AST to find all import/export statements
  // 2. Update the paths relative to each importing file
  // 3. Handle both default and named exports

  // For now, just return the content unchanged
  return content;
}

// Migrate a single file
function migrateFile(file) {
  const oldName = file.name;
  const newName = toKebabCase(oldName.replace(/\.(ts|tsx|js|jsx)$/, '')) + oldName.match(/\.(ts|tsx|js|jsx)$/)[0];
  const oldPath = file.original;
  const newPath = join(dirname(oldPath), newName);

  if (oldName === newName) {
    return null;
  }

  const relativePath = file.relative;

  console.log(`Would rename:`);
  console.log(`  ${relativePath}`);
  console.log(`  → ${relativePath.replace(oldName, newName)}\n`);

  if (!DRY_RUN) {
    try {
      // Read the file content
      const content = readFileSync(oldPath, 'utf-8');

      // Write to new location
      writeFileSync(newPath, content, 'utf-8');

      // Remove old file
      renameSync(oldPath, newPath);

      return {
        old: oldPath,
        new: newPath,
        oldName,
        newName,
      };
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      return null;
    }
  }

  return {
    old: oldPath,
    new: newPath,
    oldName,
    newName,
    dryRun: true,
  };
}

// Main execution
console.log('🔍 Scanning for files to migrate...\n');

if (DRY_RUN) {
  console.log('⚠️  DRY RUN MODE - No files will be changed\n');
}

const files = getFilesToMigrate(SRC_DIR);

if (files.length === 0) {
  console.log('✅ No files need migration!\n');
  process.exit(0);
}

console.log(`Found ${files.length} files to migrate:\n`);

const migrated = [];
const failed = [];

for (const file of files) {
  const result = migrateFile(file);
  if (result) {
    migrated.push(result);
  } else {
    failed.push(file);
  }
}

// Summary
console.log('\n📊 Summary:');
console.log(`  Total files: ${files.length}`);
console.log(`  Migrated: ${migrated.filter(m => !m.dryRun).length}`);
console.log(`  Would migrate: ${migrated.filter(m => m.dryRun).length}`);
console.log(`  Failed: ${failed.length}\n`);

if (!DRY_RUN && migrated.length > 0) {
  console.log('⚠️  IMPORTANT: You will need to manually update import statements');
  console.log('   in all files that reference the renamed components.\n');

  console.log('Run the following to find files that need updates:\n');
  migrated.forEach(m => {
    console.log(`  grep -r "${m.oldName}" src/`);
  });
  console.log('');
}

if (failed.length > 0) {
  console.error('❌ Some files failed to migrate\n');
  process.exit(1);
} else {
  console.log(DRY_RUN ? '✅ Dry run complete!\n' : '✅ Migration complete!\n');
  process.exit(0);
}
