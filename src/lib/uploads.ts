import path from 'path';

/**
 * Returns the single canonical upload directory.
 * All uploads are stored inside public/uploads/ so Next.js can serve them
 * as static assets without a custom route handler.
 */
export function getUploadStorageRoot() {
    return path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads'));
}

export function sanitizeUploadFolder(folder: string) {
    return folder.replace(/[^a-zA-Z0-9_\-/]/g, '').replace(/^\/+|\/+$/g, '');
}

export function resolveUploadPath(root: string, segments: string[]) {
    const resolvedRoot = path.resolve(root);
    const resolvedPath = path.resolve(resolvedRoot, ...segments);
    const relative = path.relative(resolvedRoot, resolvedPath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return null;
    }

    return resolvedPath;
}

export function getImageContentType(filePath: string) {
    switch (path.extname(filePath).toLowerCase()) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.webp':
            return 'image/webp';
        case '.gif':
            return 'image/gif';
        default:
            return 'application/octet-stream';
    }
}
