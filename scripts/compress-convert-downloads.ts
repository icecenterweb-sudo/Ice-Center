import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SOURCE_DIR = 'C:\\Users\\Hamidreza\\Downloads\\procced_images';
const TARGET_DIR = 'C:\\Users\\Hamidreza\\Downloads\\procced_images_webp';

async function processImages() {
    console.log(`📂 Source Directory: ${SOURCE_DIR}`);
    console.log(`📂 Target Directory: ${TARGET_DIR}\n`);

    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`❌ Source folder does not exist: ${SOURCE_DIR}`);
        process.exit(1);
    }

    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
        console.log(`📁 Created target folder: ${TARGET_DIR}\n`);
    }

    const files = fs.readdirSync(SOURCE_DIR);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'].includes(ext);
    });

    console.log(`📷 Found ${imageFiles.length} images to process...\n`);

    let processedCount = 0;
    let totalSavedBytes = 0;

    for (const file of imageFiles) {
        const inputPath = path.join(SOURCE_DIR, file);
        const fileNameWithoutExt = path.basename(file, path.extname(file));
        const outputPath = path.join(TARGET_DIR, `${fileNameWithoutExt}.webp`);

        try {
            const inputStats = fs.statSync(inputPath);
            const originalSize = inputStats.size;

            // Compress and convert to WebP using sharp
            await sharp(inputPath)
                .webp({ quality: 80, effort: 6 })
                .toFile(outputPath);

            const outputStats = fs.statSync(outputPath);
            const newSize = outputStats.size;
            const savedBytes = originalSize - newSize;
            totalSavedBytes += savedBytes;

            const savedKb = Math.round(savedBytes / 1024);
            const percent = Math.round((savedBytes / originalSize) * 100);

            console.log(`✅ ${file} -> ${path.basename(outputPath)} (${Math.round(originalSize / 1024)} KB -> ${Math.round(newSize / 1024)} KB | Saved ${savedKb} KB [${percent}%])`);
            processedCount++;
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error);
        }
    }

    const totalSavedMb = (totalSavedBytes / (1024 * 1024)).toFixed(2);
    console.log(`\n========================================`);
    console.log(`🎉 Conversion & Compression Finished!`);
    console.log(`- Successfully Processed: ${processedCount} / ${imageFiles.length}`);
    console.log(`- Total Disk Space Saved: ${totalSavedMb} MB`);
    console.log(`- Output Folder: ${TARGET_DIR}`);
    console.log(`========================================\n`);
}

processImages().catch(console.error);
