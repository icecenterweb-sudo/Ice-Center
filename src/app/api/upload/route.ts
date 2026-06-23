import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function hasCloudinaryConfig() {
  return Boolean(
    (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME) &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

async function uploadToCloudinary(file: File, folder: string) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadFolder = ['ice-center', folder].filter(Boolean).join('/');

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type: 'image',
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }

        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

async function uploadToLocalPublic(file: File, folder: string) {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || '.png';
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

    if (!hasCloudinaryConfig() && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Persistent upload storage is not configured' },
        { status: 500 }
      );
    }

    const url = hasCloudinaryConfig()
      ? await uploadToCloudinary(file, folder)
      : await uploadToLocalPublic(file, folder);

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
