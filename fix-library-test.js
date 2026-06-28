const fs = require('fs');
const content = fs.readFileSync('tests/e2e/library.spec.ts', 'utf8');
fs.writeFileSync('tests/e2e/library.spec.ts', content.replace(/waitUntil: "domcontentloaded"/g, 'waitUntil: "networkidle"'));
console.log('Fixed waitUntil settings');