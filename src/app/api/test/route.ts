import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      success: true,
      message: '🎉 دیتابیس متصل شد!'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در اتصال به دیتابیس'
    }, { status: 500 });
  }
}