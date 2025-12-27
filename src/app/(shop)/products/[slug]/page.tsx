import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';
import { getProductBySlug } from '@/lib/prisma/queries-product';
import { generateProductPageJsonLd } from '@/lib/seo/product-jsonld';

type PageProps = {
    params: Promise<{ slug: string }>;
};

export const runtime = 'nodejs';
export const revalidate = 60; // Revalidate every 60 seconds


export default async function ProductPage({ params }: PageProps) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    // Product not found - show 404
    if (!product) {
        notFound();
    }

    // Build specifications from DB fields
    const technicalSpecs = [];

    // Technical specs
    if (product.brand) technicalSpecs.push({ label: 'برند', value: product.brand });
    if (product.model) technicalSpecs.push({ label: 'مدل', value: product.model });
    if (product.manufacturingCountry) technicalSpecs.push({ label: 'کشور سازنده', value: product.manufacturingCountry });
    if (product.condition) technicalSpecs.push({ label: 'وضعیت', value: product.condition === 'NEW' ? 'نو' : product.condition === 'REFURBISHED' ? 'بازسازی شده' : 'کارکرده' });

    // Power & Electrical
    const electricalSpecs = [];
    if (product.powerSource) electricalSpecs.push({ label: 'منبع تغذیه', value: product.powerSource === 'ELECTRIC' ? 'برقی' : product.powerSource === 'GAS' ? 'گازی' : 'ترکیبی' });
    if (product.voltage) electricalSpecs.push({ label: 'ولتاژ', value: product.voltage });
    if (product.phase) electricalSpecs.push({ label: 'فاز', value: `${product.phase} فاز` });
    if (product.power) electricalSpecs.push({ label: 'توان', value: product.power });
    if (product.powerConsumption) electricalSpecs.push({ label: 'مصرف برق', value: `${product.powerConsumption} کیلووات` });

    // Cooling
    if (product.coolingSystem) electricalSpecs.push({ label: 'سیستم خنک‌کننده', value: product.coolingSystem === 'AIR' ? 'هوایی' : product.coolingSystem === 'WATER' ? 'آبی' : 'ترکیبی' });

    // Dimensions
    const dimensionSpecs = [];
    if (product.width) dimensionSpecs.push({ label: 'عرض', value: `${product.width} سانتی‌متر` });
    if (product.depth) dimensionSpecs.push({ label: 'عمق', value: `${product.depth} سانتی‌متر` });
    if (product.height) dimensionSpecs.push({ label: 'ارتفاع', value: `${product.height} سانتی‌متر` });
    if (product.weightNet) dimensionSpecs.push({ label: 'وزن خالص', value: `${product.weightNet} کیلوگرم` });
    if (product.weightGross) dimensionSpecs.push({ label: 'وزن ناخالص', value: `${product.weightGross} کیلوگرم` });

    // Build specifications categories
    const specifications = [];
    if (technicalSpecs.length > 0) specifications.push({ title: 'مشخصات فنی', specs: technicalSpecs });
    if (electricalSpecs.length > 0) specifications.push({ title: 'مشخصات الکتریکی', specs: electricalSpecs });
    if (dimensionSpecs.length > 0) specifications.push({ title: 'ابعاد و وزن', specs: dimensionSpecs });

    // Parse JSON specifications if exists
    if (product.specifications && typeof product.specifications === 'object') {
        const jsonSpecs = product.specifications as Record<string, string>;
        const additionalSpecs = Object.entries(jsonSpecs).map(([label, value]) => ({
            label,
            value: String(value),
        }));
        if (additionalSpecs.length > 0) {
            specifications.push({ title: 'مشخصات تکمیلی', specs: additionalSpecs });
        }
    }

    // Build features from DB features array
    const features = product.features && product.features.length > 0
        ? product.features
        : ['کیفیت ساخت عالی', 'گارانتی معتبر', 'پشتیبانی 24 ساعته'];

    // Get category info for breadcrumb
    const categoryName = product.subcategory?.category?.name || 'محصولات';
    const categorySlug = product.subcategory?.category?.slug;
    const subcategoryName = product.subcategory?.name || '';

    // Transform DB product to component-friendly format
    const productData = {
        name: product.name,
        nameEnglish: product.model ? `${product.brand || ''} ${product.model}`.trim() : '',
        brand: product.brand || 'آیس سنتر',
        model: product.model || '',
        price: product.price,
        listPrice: product.listPrice,
        stock: product.stock,
        inventoryStatus: product.inventoryStatus,
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        images: product.images.length > 0
            ? product.images
            : ['https://via.placeholder.com/500x500?text=No+Image'],
        warranty: product.warranty || 'گارانتی آیس سنتر',
        seller: 'فروشنده: آیس سنتر ایران',
        description: product.description || '',
        specifications,
        features,
        categoryName,
        subcategoryName,
        sku: product.sku,
    };

    // Generate JSON-LD structured data
    const jsonLd = generateProductPageJsonLd({
        product: {
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            price: product.price,
            listPrice: product.listPrice,
            images: product.images,
            sku: product.sku,
            brand: product.brand || 'آیس سنتر',
            warranty: product.warranty || 'گارانتی آیس سنتر',
            rating: product.rating || 0,
            reviewCount: product.reviewCount || 0,
            inventoryStatus: product.inventoryStatus,
            categoryName,
            subcategoryName,
        },
        categorySlug,
    });

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductClient product={productData} />
        </>
    );
}

