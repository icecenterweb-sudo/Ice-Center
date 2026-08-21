import fs from 'fs';
import path from 'path';

function walkDir(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                walkDir(fullPath, fileList);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

function verifyPatterns() {
    console.log('🔍 Scanning codebase for HTML pattern attributes...\n');
    const srcDir = path.join(process.cwd(), 'src');
    const files = walkDir(srcDir);

    let patternCount = 0;
    let failedCount = 0;

    const patternRegex = /pattern=["']([^"']+)["']/g;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = patternRegex.exec(content)) !== null) {
            patternCount++;
            const patternStr = match[1];
            const relPath = path.relative(process.cwd(), file);
            try {
                // Test with browser 'v' flag
                new RegExp('^(?:' + patternStr + ')$', 'v');
                console.log(`✅ [OK] ${relPath}: pattern="${patternStr}"`);
            } catch (err: unknown) {
                failedCount++;
                console.error(`❌ [INVALID REGEX (v flag)] ${relPath}: pattern="${patternStr}"`);
                console.error(`   Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }

    console.log(`\n📊 Scanned ${files.length} files, found ${patternCount} pattern attributes.`);
    if (failedCount > 0) {
        console.error(`❌ ${failedCount} patterns failed 'v' flag validation!`);
        process.exit(1);
    } else {
        console.log('🎉 All pattern attributes are valid under RegExp v flag!');
    }
}

verifyPatterns();
