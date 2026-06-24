import fs from 'fs';
import path from 'path';

const IGNORED_DIRS = [
  'node_modules',
  'coverage',
  '.git',
  '.github',
  'dist',
  '.lovable',
  '.roo',
  '.claude',
  'completed', // Completed sprint folders
  'archive',   // Archived docs
  'SPRINTS',   // Historical sprint trackings
  'specs',     // Technical specifications
  'ru'         // Translation / Russian legacy analysis
];

function getAllMarkdownFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.includes(item)) {
        getAllMarkdownFiles(fullPath, files);
      }
    } else if (stat.isFile() && item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkLinks() {
  console.log('🔍 Scanning active markdown files for broken relative links...');
  const mdFiles = getAllMarkdownFiles(process.cwd());
  let totalLinksChecked = 0;
  let brokenLinksCount = 0;

  mdFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const relativeDir = path.dirname(file);

    lines.forEach((lineText, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const linkRegex = /!?\[.*?\]\((.*?)\)/g;
      let match;
      while ((match = linkRegex.exec(lineText)) !== null) {
        let linkTarget = match[1].trim();

        // Skip absolute URLs, mails, and anchor-only links
        if (
          linkTarget.startsWith('http://') ||
          linkTarget.startsWith('https://') ||
          linkTarget.startsWith('mailto:') ||
          linkTarget.startsWith('#') ||
          !linkTarget
        ) {
          continue;
        }

        totalLinksChecked++;

        // Handle file:// protocol
        if (linkTarget.startsWith('file:///')) {
          linkTarget = linkTarget.substring(8);
          if (linkTarget.startsWith('c:') || linkTarget.startsWith('d:') || linkTarget.startsWith('C:') || linkTarget.startsWith('D:')) {
            // Keep absolute Win path
          } else {
            linkTarget = path.join(process.cwd(), linkTarget);
          }
        }

        // Strip query params or anchors
        const hashIndex = linkTarget.indexOf('#');
        if (hashIndex !== -1) {
          linkTarget = linkTarget.substring(0, hashIndex);
        }

        if (!linkTarget) {
          continue;
        }

        // Decode URL-encoded characters
        try {
          linkTarget = decodeURIComponent(linkTarget);
        } catch (e) {
          // Ignore decode errors
        }

        // Resolve path relative to the file containing the link
        let resolvedPath;
        if (path.isAbsolute(linkTarget)) {
          resolvedPath = linkTarget;
        } else {
          resolvedPath = path.resolve(relativeDir, linkTarget);
        }

        if (!fs.existsSync(resolvedPath)) {
          brokenLinksCount++;
          const relativeFile = path.relative(process.cwd(), file);
          console.error(`❌ Broken link in [${relativeFile}:${lineNumber}]: link target "${match[1]}" resolved to "${resolvedPath}" (File does not exist)`);
        }
      }
    });
  });

  console.log('\n--- Summary ---');
  console.log(`📂 Total Active Markdown Files Scanned: ${mdFiles.length}`);
  console.log(`🔗 Total Local Links Checked:   ${totalLinksChecked}`);
  if (brokenLinksCount > 0) {
    console.error(`🚨 Found ${brokenLinksCount} broken link(s) in active documentation!`);
    process.exit(1);
  } else {
    console.log('✅ All active local links are healthy!');
    process.exit(0);
  }
}

checkLinks();
