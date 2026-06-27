import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/admin-auth';
import { getUploadStorageRoot, sanitizeUploadFolder } from '@/lib/uploads';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MIME_TO_EXTENSION: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
};
const ALLOWED_IMAGE_TYPES = new Set(Object.keys(MIME_TO_EXTENSION));

async function uploadToLocalStorage(file: File, folder: string) {
  const uploadDir = path.join(getUploadStorageRoot(), folder);
  await mkdir(uploadDir, { recursive: true });

  const ext = MIME_TO_EXTENSION[file.type] || '.png';
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, filename);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);

  return folder ? `/uploads/${folder}/${filename}` : `/uploads/${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'فایلی انتخاب نشده' },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid image type' },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Image size must be 5MB or less' },
        { status: 413 }
      );
    }

    const folder = (formData.get('folder') as string || '').replace(/[^a-zA-Z0-9_\-\/]/g, '');
    const safeFolder = sanitizeUploadFolder(folder);

    const url = await uploadToLocalStorage(file, safeFolder);

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error: unknown) {
    console.error('خطا در آپلود:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
