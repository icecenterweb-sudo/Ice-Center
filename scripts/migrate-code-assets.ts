import * as fs from 'fs';
import * as path from 'path';

// Define target directories
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper to determine the target subfolder based on url and file context
function getSubfolder(url: string, filePath: string): string {
    const filename = path.basename(new URL(url).pathname).toLowerCase();
    const fileContentContext = filePath.toLowerCase();

    if (filename.includes('article') || filename.includes('blog') || fileContentContext.includes('blog')) {
        return 'blog-covers';
    }
    if (fileContentContext.includes('heroslider') || filename.includes('slider')) {
        return 'sliders';
    }
    if (filename.endsWith('.gif') || filename.includes('banner') || filename.includes('snowflake')) {
        return 'banners';
    }
    if (fileContentContext.includes('category')) {
        return 'categories';
    }
    return 'products'; // Fallback for general products
}

// Download function
async function downloadImage(url: string, targetPath: string): Promise<boolean> {
    try {
        console.log(`  → Fetching: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Ensure parent directory exists
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        
        fs.writeFileSync(targetPath, buffer);
        console.log(`  ✅ Downloaded to: ${path.relative(process.cwd(), targetPath)}`);
        return true;
    } catch (err: any) {
        console.error(`  ❌ Failed to download ${url}:`, err.message);
        return false;
    }
}

// Recursively find all source files
function getSourceFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                getSourceFiles(filePath, fileList);
            }
        } else if (/\.(tsx|ts|jsx|js|css)$/.test(file)) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

async function main() {
    console.log('🚀 Starting Hardcoded Cloudinary URLs to Local Assets Migration');
    console.log('================================================================');

    const srcDir = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcDir)) {
        console.error('❌ src folder not found!');
        process.exit(1);
    }

    const files = getSourceFiles(srcDir);
    console.log(`🔍 Scanned ${files.length} source files.`);

    // Find all unique Cloudinary URLs in code
    const cloudinaryUrlMap: Map<string, { occurrences: { file: string; line: number }[], subfolder: string, localPath: string, localUrl: string }> = new Map();
    const urlRegex = /https?:\/\/res\.cloudinary\.com\/[^\s"'`<>]+/g;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            const matches = line.match(urlRegex);
            if (matches) {
                matches.forEach(match => {
                    // Clean trailing punctuation from regex capture (like quotes, parentheses, brackets)
                    const cleanUrl = match.replace(/['"`\);\],].*$/, '');
                    
                    if (!cloudinaryUrlMap.has(cleanUrl)) {
                        const subfolder = getSubfolder(cleanUrl, file);
                        const ext = path.extname(new URL(cleanUrl).pathname) || '.jpg';
                        const nameWithoutExt = path.basename(new URL(cleanUrl).pathname, ext);
                        
                        // Sanitize base name
                        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
                        const filename = `${sanitizedName}${ext}`;
                        
                        const localPath = path.join(UPLOAD_DIR, subfolder, filename);
                        const localUrl = `/uploads/${subfolder}/${filename}`;

                        cloudinaryUrlMap.set(cleanUrl, {
                            occurrences: [],
                            subfolder,
                            localPath,
                            localUrl
                        });
                    }

                    cloudinaryUrlMap.get(cleanUrl)!.occurrences.push({
                        file,
                        line: index + 1
                    });
                });
            }
        });
    }

    console.log(`Found ${cloudinaryUrlMap.size} unique hardcoded Cloudinary URLs.`);

    // Download each unique URL and update code files
    for (const [cloudinaryUrl, details] of cloudinaryUrlMap.entries()) {
        console.log(`\nProcessing URL: ${cloudinaryUrl}`);
        console.log(`  - Target folder: ${details.subfolder}`);
        console.log(`  - Local path: ${details.localUrl}`);
        console.log(`  - Occurrences in code: ${details.occurrences.length}`);

        // Try downloading it
        const success = await downloadImage(cloudinaryUrl, details.localPath);
        
        if (success) {
            // Replace url in all occurrence files
            const filesToUpdate = new Set(details.occurrences.map(o => o.file));
            
            for (const file of filesToUpdate) {
                let content = fs.readFileSync(file, 'utf8');
                // Replace all instances of this Cloudinary URL with the local URL
                // We use escape RegExp to ensure exact match
                const escapedUrl = cloudinaryUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedUrl, 'g');
                
                content = content.replace(regex, details.localUrl);
                fs.writeFileSync(file, content, 'utf8');
                console.log(`  ✏️ Updated file: ${path.relative(process.cwd(), file)}`);
            }
        }
    }

    console.log('\n================================================================');
    console.log('🎉 Static Assets Migration Completed successfully!');
    console.log('================================================================');
}

main().catch(console.error);
