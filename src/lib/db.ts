import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('لطفا MONGODB_URI را در .env.local تعریف کنید');
}

async function dbConnect() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ اتصال به MongoDB موفق بود');
  } catch (error) {
    console.error('❌ خطا در اتصال به MongoDB:', error);
    throw error;
  }
}

export default dbConnect;