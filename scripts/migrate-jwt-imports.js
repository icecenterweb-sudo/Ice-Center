const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results.push(...walkDir(filePath));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  }
  return results;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = walkDir(srcDir);
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("@/lib/user-jwt")) {
    content = content.replace(/@\/lib\/user-jwt/g, '@/lib/jwt');
    content = content.replace(/getUserTokenCookieOptions/g, 'getTokenCookieOptions');
    fs.writeFileSync(file, content, 'utf8');
    changed++;
    console.log('Updated:', path.relative(srcDir, file));
  }
}

console.log(`\nDone! Updated ${changed} files.`);
