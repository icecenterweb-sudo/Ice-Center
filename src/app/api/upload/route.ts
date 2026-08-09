import { NextRequest, NextResponse, connection } from 'next/server';
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

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;
  
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }
  if (mimeType === 'image/gif') {
    return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  }
  if (mimeType === 'image/webp') {
    return (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer.length >= 12 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    );
  }
  return false;
}

async function uploadToLocalStorage(file: File, buffer: Buffer, folder: string) {
  const uploadDir = path.join(getUploadStorageRoot(), folder);
  await mkdir(uploadDir, { recursive: true });

  // Store the original file as-is. Image optimization (WebP conversion, resizing)
  // runs offline via `npm run convert:webp`, keeping the request path light and the
  // app free of the native sharp dependency. file.type is validated against
  // ALLOWED_IMAGE_TYPES before we get here, so the extension lookup always resolves.
  const ext = MIME_TO_EXTENSION[file.type];
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadDir, filename);

  await writeFile(filePath, buffer);

  return folder ? `/uploads/${folder}/${filename}` : `/uploads/${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    await connection();
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
        { success: false, message: 'نوع تصویر نامعتبر است' },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { success: false, message: 'حجم تصویر باید ۵ مگابایت یا کمتر باشد' },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { success: false, message: 'محتوای فایل با نوع تصویر مطابقت ندارد' },
        { status: 400 }
      );
    }

    const folder = (formData.get('folder') as string || '').replace(/[^a-zA-Z0-9_\-\/]/g, '');
    const safeFolder = sanitizeUploadFolder(folder);

    const url = await uploadToLocalStorage(file, buffer, safeFolder);

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
