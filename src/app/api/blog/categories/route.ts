import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createCategorySchema } from '@/lib/blog/validation';
import { getBlogCategories } from '@/lib/blog/queries';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/blog/categories - List all blog categories
export async function GET() {
    try {
        const categories = await getBlogCategories();
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching blog categories:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت دسته‌بندی‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/blog/categories - Create new category
export async function POST(request: Request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const body = await request.json().catch(() => null);

        // Validate input
        const result = createCategorySchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: 'داده‌های نامعتبر', details: result.error.flatten() },
                { status: 400 }
            );
        }

        // Check slug uniqueness
        const existingCategory = await prisma.blogCategory.findUnique({
            where: { slug: result.data.slug },
        });

        if (existingCategory) {
            return NextResponse.json(
                { error: 'این اسلاگ قبلاً استفاده شده است' },
                { status: 409 }
            );
        }

        const category = await prisma.blogCategory.create({
            data: result.data,
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating blog category:', error);
        return NextResponse.json(
            { error: 'خطا در ایجاد دسته‌بندی' },
            { status: 500 }
        );
    }
}
