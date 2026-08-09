import { NextRequest, NextResponse, connection } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { requireAdmin } from '@/lib/admin-auth';

interface MediaItem {
    url: string;
    filename: string;
    folder: string;
    size: number;
    updatedAt: string;
}

async function scanDirectory(dirPath: string, relativeFolder: string): Promise<MediaItem[]> {
    const items: MediaItem[] = [];
    try {
        const files = await readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                const subFolder = relativeFolder ? `${relativeFolder}/${file.name}` : file.name;
                const subItems = await scanDirectory(fullPath, subFolder);
                items.push(...subItems);
            } else if (file.isFile() && /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name)) {
                const fileStat = await stat(fullPath);
                const url = relativeFolder
                    ? `/uploads/${relativeFolder}/${file.name}`
                    : `/uploads/${file.name}`;
                
                items.push({
                    url,
                    filename: file.name,
                    folder: relativeFolder || 'root',
                    size: fileStat.size,
                    updatedAt: fileStat.mtime.toISOString(),
                });
            }
        }
    } catch (err) {
        console.warn(`Could not read directory ${dirPath}:`, err);
    }
    return items;
}

export async function GET(request: NextRequest) {
    await connection(); // Required for request.headers with cacheComponents
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
        const mediaItems = await scanDirectory(uploadsRoot, '');

        // Sort by newest first
        mediaItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return NextResponse.json({
            success: true,
            media: mediaItems,
        });
    } catch (error) {
        console.error('Failed to list media:', error);
        return NextResponse.json(
            { success: false, error: 'خطا در دریافت لیست تصاویر' },
            { status: 500 }
        );
    }
}
