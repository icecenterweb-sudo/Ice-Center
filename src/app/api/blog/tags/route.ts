import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createTagSchema } from '@/lib/blog/validation';
import { getBlogTags } from '@/lib/blog/queries';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/blog/tags - List all blog tags
export async function GET() {
    try {
        const tags = await getBlogTags();
        return NextResponse.json(tags);
    } catch (error) {
        console.error('Error fetching blog tags:', error);
        return NextResponse.json(
            { error: 'خطا در دریافت تگ‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/blog/tags - Create new tag
export async function POST(request: Request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const body = await request.json();

        // Validate input
        const result = createTagSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: 'داده‌های نامعتبر', details: result.error.flatten() },
                { status: 400 }
            );
        }

        // Check slug uniqueness
        const existingTag = await prisma.blogTag.findUnique({
            where: { slug: result.data.slug },
        });

        if (existingTag) {
            return NextResponse.json(
                { error: 'این اسلاگ قبلاً استفاده شده است' },
                { status: 409 }
            );
        }

        const tag = await prisma.blogTag.create({
            data: result.data,
        });

        return NextResponse.json(tag, { status: 201 });
    } catch (error) {
        console.error('Error creating blog tag:', error);
        return NextResponse.json(
            { error: 'خطا در ایجاد تگ' },
            { status: 500 }
        );
    }
}
