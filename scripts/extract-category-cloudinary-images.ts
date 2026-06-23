import { readFile, writeFile } from 'fs/promises';
import path from 'path';

async function main() {
    const backupFilePath = path.join(process.cwd(), 'backups', 'db-backup-2026-06-12T08-22-33-287Z.json');
    const outputFilePath = path.join(process.cwd(), 'backups', 'cloudinary-category-images.txt');

    try {
        console.log(`Reading backup file from: ${backupFilePath}...`);
        const fileContent = await readFile(backupFilePath, 'utf-8');
        const backupData = JSON.parse(fileContent);

        const categories = backupData.data?.categories || [];
        console.log(`Found ${categories.length} total categories in the backup.`);

        const cloudinaryUrls: string[] = [];

        for (const cat of categories) {
            if (cat.image && cat.image.includes('cloudinary.com')) {
                console.log(`- Category "${cat.name}" (ID: ${cat.id}): ${cat.image}`);
                cloudinaryUrls.push(cat.image);
            }
        }

        console.log(`\nExtracted ${cloudinaryUrls.length} Cloudinary image URLs.`);

        if (cloudinaryUrls.length > 0) {
            await writeFile(outputFilePath, cloudinaryUrls.join('\n'), 'utf-8');
            console.log(`Saved extracted URLs to: ${outputFilePath}`);
        } else {
            console.log('No Cloudinary image URLs found in the categories section.');
        }

    } catch (error) {
        console.error('Error during extraction:', error);
    }
}

main();
