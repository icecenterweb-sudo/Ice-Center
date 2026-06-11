import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { requireAdmin } from '@/lib/admin-auth';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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

    // تبدیل File به Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // آپلود به Cloudinary
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'ice-center-products', // پوشه در Cloudinary
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error('Cloudinary upload returned no result'));
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
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
