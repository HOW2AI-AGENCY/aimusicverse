#!/usr/bin/env node
/**
 * Accessibility Audit Script using axe-core
 * Checks key pages for accessibility violations
 */

const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const pages = [
  { name: 'Home', url: 'http://localhost:5173/' },
  { name: 'Library', url: 'http://localhost:5173/library' },
  { name: 'Generate', url: 'http://localhost:5173/generate' },
  { name: 'Projects', url: 'http://localhost:5173/projects' },
];

async function runAccessibilityAudit() {
  console.log('🔍 Starting accessibility audit with axe-core...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    timestamp: new Date().toISOString(),
    pages: [],
    summary: {
      totalViolations: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    }
  };

  for (const pageInfo of pages) {
    console.log(`📄 Testing: ${pageInfo.name} (${pageInfo.url})`);
    
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      
      // Navigate with timeout
      await page.goto(pageInfo.url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait a bit for any dynamic content
      await page.waitForTimeout(2000);

      // Run axe
      const axeResults = await new AxePuppeteer(page).analyze();

      const pageResult = {
        name: pageInfo.name,
        url: pageInfo.url,
        violations: axeResults.violations.length,
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        violationsByImpact: {
          critical: axeResults.violations.filter(v => v.impact === 'critical').length,
          serious: axeResults.violations.filter(v => v.impact === 'serious').length,
          moderate: axeResults.violations.filter(v => v.impact === 'moderate').length,
          minor: axeResults.violations.filter(v => v.impact === 'minor').length,
        },
        violationDetails: axeResults.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.length,
          example: v.nodes[0] ? {
            html: v.nodes[0].html.substring(0, 100),
            target: v.nodes[0].target
          } : null
        }))
      };

      results.pages.push(pageResult);
      results.summary.totalViolations += pageResult.violations;
      results.summary.critical += pageResult.violationsByImpact.critical;
      results.summary.serious += pageResult.violationsByImpact.serious;
      results.summary.moderate += pageResult.violationsByImpact.moderate;
      results.summary.minor += pageResult.violationsByImpact.minor;

      console.log(`  ✅ ${pageResult.passes} passed`);
      console.log(`  ❌ ${pageResult.violations} violations`);
      console.log(`     - Critical: ${pageResult.violationsByImpact.critical}`);
      console.log(`     - Serious: ${pageResult.violationsByImpact.serious}`);
      console.log(`     - Moderate: ${pageResult.violationsByImpact.moderate}`);
      console.log(`     - Minor: ${pageResult.violationsByImpact.minor}\n`);

      await page.close();
    } catch (error) {
      console.error(`  ⚠️  Error testing ${pageInfo.name}: ${error.message}\n`);
      results.pages.push({
        name: pageInfo.name,
        url: pageInfo.url,
        error: error.message
      });
    }
  }

  await browser.close();

  // Save results
  const resultsPath = path.join(__dirname, 'accessibility-audit-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Print summary
  console.log('📊 Audit Summary:');
  console.log(`   Total Violations: ${results.summary.totalViolations}`);
  console.log(`   Critical: ${results.summary.critical}`);
  console.log(`   Serious: ${results.summary.serious}`);
  console.log(`   Moderate: ${results.summary.moderate}`);
  console.log(`   Minor: ${results.summary.minor}`);
  console.log(`\n   Results saved to: ${resultsPath}`);

  // Exit with error if critical or serious violations found
  if (results.summary.critical > 0 || results.summary.serious > 0) {
    console.log('\n❌ FAILED: Critical or serious accessibility violations found!');
    process.exit(1);
  } else {
    console.log('\n✅ PASSED: No critical or serious violations found!');
    process.exit(0);
  }
}

// Check if server is running
console.log('ℹ️  Make sure dev server is running on http://localhost:5173');
console.log('   Run: npm run dev\n');

setTimeout(() => {
  runAccessibilityAudit().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}, 2000);
