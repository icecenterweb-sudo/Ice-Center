import CategorySection from '@/components/home/CategorySection';
import HeroSlider from '@/components/home/HeroSlider';
import AmazingOfferCarousel from '@/components/home/OfferCarousel';

async function getProducts() {
  const res = await fetch('http://localhost:3000/api/products', {
    cache: 'no-store'
  });
  
  if (!res.ok) return [];
  
  const data = await res.json();
  return data.data || [];
}

export default async function Home() {
  const products = await getProducts();

  return (
    <>
      {/* اسلایدر اصلی */}
      <HeroSlider />

      {/* بخش دسته‌بندی‌ها */}
      <CategorySection />

      {/* تخفیف‌های ویژه */}
      <AmazingOfferCarousel />

      {/* بقیه محتوا */}
      <main className="min-h-screen p-8" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">
            🍦 فروشگاه آیس سنتر
          </h1>
          <p className="text-center text-gray-600 mb-8">
            تجهیزات و دستگاه‌های صنعتی بستنی، آبمیوه‌گیری و یخ‌سازی
          </p>

          {products.length === 0 ? (
            <p className="text-center text-gray-500">
              هنوز محصولی وجود ندارد
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <div 
                  key={product._id} 
                  className="border rounded-lg overflow-hidden hover:shadow-xl transition-shadow bg-white"
                >
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-56 object-cover"
                    />
                  ) : (
                    <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-4xl">📦</span>
                    </div>
                  )}
                  
                  <div className="p-4">
                    {product.category && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    )}
                    
                    <h3 className="font-bold text-lg mb-2 mt-2">
                      {product.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description || 'بدون توضیحات'}
                    </p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl font-bold text-blue-600">
                        {product.price.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                    
                    <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                      🛒 افزودن به سبد
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      موجودی: {product.stock} عدد
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}