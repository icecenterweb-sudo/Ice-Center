import { readFile, stat } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import {
    getImageContentType,
    getLegacyPublicUploadRoot,
    getUploadStorageRoot,
    resolveUploadPath,
} from '@/lib/uploads';

export const runtime = 'nodejs';

async function findUploadFile(segments: string[]) {
    const roots = [getUploadStorageRoot(), getLegacyPublicUploadRoot()];

    for (const root of roots) {
        const filePath = resolveUploadPath(root, segments);
        if (!filePath) continue;

        try {
            const fileStat = await stat(filePath);
            if (fileStat.isFile()) {
                return filePath;
            }
        } catch {
            // Try the next upload root.
        }
    }

    return null;
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const filePath = await findUploadFile(path);

    if (!filePath) {
        return new NextResponse('Not found', { status: 404 });
    }

    const file = await readFile(filePath);

    return new NextResponse(file, {
        headers: {
            'Content-Type': getImageContentType(filePath),
            'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}

export async function HEAD(
    _request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const filePath = await findUploadFile(path);

    if (!filePath) {
        return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
        headers: {
            'Content-Type': getImageContentType(filePath),
            'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
