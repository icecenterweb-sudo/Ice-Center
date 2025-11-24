import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';

// دریافت همه محصولات
export async function GET() {
  try {
    await dbConnect();
    const products = await Product.find({ isActive: true });
    
    return NextResponse.json({ 
      success: true, 
      count: products.length,
      data: products 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'خطا در دریافت محصولات' 
    }, { status: 500 });
  }
}

// ساخت محصول جدید
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const product = await Product.create(body);
    
    return NextResponse.json({ 
      success: true, 
      data: product 
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'خطا در ساخت محصول' 
    }, { status: 400 });
  }
}