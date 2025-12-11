import Image from 'next/image';

const similarProducts = [
    {
        id: 1,
        name: 'بستنی ساز ایستاده مدل TS-50',
        price: 185000000,
        image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999204/001-min-2_ip52ev.jpg'
    },
    {
        id: 2,
        name: 'بار سفت کن صنعتی 12 لیتری',
        price: 145000000,
        image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999218/dc2c39_kz3wpy.jpg'
    },
    {
        id: 3,
        name: 'یخ ساز 50 کیلویی صنعتی',
        price: 45000000,
        image: 'https://res.cloudinary.com/dxooxiqcz/image/upload/v1763999174/yakhsaz-50kg-1232_adlyut.jpg'
    }
];

export default function SimilarProducts() {
    return (
        <div className="bg-white rounded-lg border border-gray-200 mt-4 overflow-hidden">
            <h3 className="font-bold text-gray-900 p-3 bg-gray-50 border-b border-gray-100 text-sm">محصولات مشابه</h3>
            <div className="divide-y divide-gray-100">
                {similarProducts.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="relative w-12 h-12 flex-shrink-0 bg-white border border-gray-100 rounded-md overflow-hidden">
                            <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-contain p-1 group-hover:scale-110 transition-transform"
                            />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-xs font-medium text-gray-700 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {item.name}
                            </h4>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-900 text-xs">
                                    {new Intl.NumberFormat('fa-IR').format(item.price)}
                                </span>
                                <span className="text-[10px] text-gray-500">تومان</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-2 border-t border-gray-100">
                <button className="w-full text-xs text-blue-600 font-bold py-1.5 hover:bg-blue-50 rounded transition-colors">
                    مشاهده موارد بیشتر
                </button>
            </div>
        </div>
    );
}
