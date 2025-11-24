import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ 
      success: true, 
      message: '🎉 دیتابیس متصل شد!' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'خطا در اتصال به دیتابیس' 
    }, { status: 500 });
  }
}