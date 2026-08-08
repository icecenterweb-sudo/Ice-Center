import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s_+\/\\#.,;:-]+/g, '-')
        .replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function getUniqueSlug(baseName: string): Promise<string> {
    const baseSlug = slugify(baseName) || 'product';
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
    }
    return slug;
}

interface ParsedProduct {
    num: number;
    rawTitle: string;
    name: string;
    brand: string;
    model: string | null;
    phase: number | null;
    voltage: string | null;
    power: string | null;
    width: number | null;
    depth: number | null;
    height: number | null;
    weightNet: number | null;
    subcategoryId: number;
    specifications: Record<string, string>;
    features: string[];
    keywords: string[];
    description: string;
}

function parseProductsTxt(): ParsedProduct[] {
    const filePath = path.join(process.cwd(), 'products.txt');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Split by separator lines (------ or ------)
    const blocks = content.split(/[-–]{4,}/).map(b => b.trim()).filter(Boolean);

    const parsedList: ParsedProduct[] = [];
    const seenNumbers = new Set<number>();

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;

        // Find line starting with product number e.g. "۱-..." or "27-..." or "📌 عنوان:"
        let titleLine = lines[0];
        let numMatch = titleLine.match(/^([۰-۹0-9]+)\s*[-–]/);
        let itemNum = numMatch ? parseInt(numMatch[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10) : 0;

        if (!itemNum) {
            // Check if title is on next lines
            for (let i = 0; i < lines.length; i++) {
                const m = lines[i].match(/^([۰-۹0-9]+)\s*[-–]/);
                if (m) {
                    itemNum = parseInt(m[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
                    titleLine = lines[i];
                    break;
                }
            }
        }

        // Avoid duplicate item numbers from the file (like the second #31)
        if (itemNum && seenNumbers.has(itemNum)) {
            console.log(`[Skip Duplicate in Text] Item #${itemNum} already processed.`);
            continue;
        }
        if (itemNum) seenNumbers.add(itemNum);

        // Extract title
        let cleanTitle = titleLine.replace(/^([۰-۹0-9]+)\s*[-–]\s*/, '').replace(/📌\s*عنوان:\s*/, '').trim();

        // Extract properties from lines
        const specs: Record<string, string> = {};
        const features: string[] = [];
        let keywords: string[] = [];
        let description = '';

        let brand = '';
        let model: string | null = null;
        let phase: number | null = null;
        let voltage: string | null = null;
        let power: string | null = null;
        let width: number | null = null;
        let depth: number | null = null;
        let height: number | null = null;
        let weightNet: number | null = null;

        for (const line of lines) {
            if (line.startsWith('📌 عنوان:') || line.startsWith('📍 عنوان:')) {
                cleanTitle = line.replace(/.*عنوان:\s*/, '').trim();
            } else if (line.includes('برند:') || line.startsWith('برند')) {
                brand = line.replace(/.*برند:?\s*/, '').trim();
            } else if (line.includes('مدل:') || line.startsWith('مدل')) {
                model = line.replace(/.*مدل:?\s*/, '').trim();
            } else if (line.includes('فاز') || line.includes('برق')) {
                const val = line.replace(/.*(برق|فاز):?\s*/, '').trim();
                specs['برق مصرفی'] = val;
                if (val.includes('سه فاز') || val.includes('۳ فاز') || val.includes('380')) {
                    phase = 3;
                    voltage = '۳۸۰ ولت';
                } else if (val.includes('تک فاز') || val.includes('۱ فاز') || val.includes('220')) {
                    phase = 1;
                    voltage = '۲۲۰ ولت';
                }
            } else if (line.includes('توان کمپرسور') || line.includes('کمپرسور') && line.includes('اسب')) {
                const val = line.replace(/.*(توان|قدرت)\s*کمپرسور:?\s*/, '').trim();
                specs['توان کمپرسور'] = val;
                if (!power) power = val;
            } else if (line.includes('نوع کمپرسور')) {
                specs['نوع کمپرسور'] = line.replace(/.*نوع کمپرسور:?\s*/, '').trim();
            } else if (line.includes('ظرفیت تولید') || line.includes('تولید در ساعت')) {
                const val = line.replace(/.*(ظرفیت تولید|تولید در ساعت):?\s*/, '').trim();
                specs['ظرفیت تولید'] = val;
                features.push(`ظرفیت تولید: ${val}`);
            } else if (line.includes('مخزن') || line.includes('حجم مخزن') || line.includes('ظرفیت مخزن')) {
                const val = line.replace(/.*(مخزن|حجم مخزن|ظرفیت مخزن):?\s*/, '').trim();
                specs['ظرفیت مخزن'] = val;
            } else if (line.includes('بدنه')) {
                specs['جنس بدنه'] = line.replace(/.*(نوع بدنه|جنس بدنه):?\s*/, '').trim();
            } else if (line.includes('ابعاد')) {
                const dimStr = line.replace(/.*ابعاد:?\s*/, '').trim();
                specs['ابعاد'] = dimStr;
                // Try parsing width, depth, height
                // Formats: "63 عرض*80 عمق *ارتفاع 150", "عرض 75 عمق 93 ارتفاع 165", "ارتفاع 183، عمق 93، عرض 65", "40 × 58 × 87"
                const wMatch = dimStr.match(/(?:عرض|W)\s*[:\s]*([۰-۹0-9.]+)/i) || dimStr.match(/([۰-۹0-9.]+)\s*عرض/);
                const dMatch = dimStr.match(/(?:عمق|D)\s*[:\s]*([۰-۹0-9.]+)/i) || dimStr.match(/([۰-۹0-9.]+)\s*عمق/);
                const hMatch = dimStr.match(/(?:ارتفاع|H)\s*[:\s]*([۰-۹0-9.]+)/i) || dimStr.match(/([۰-۹0-9.]+)\s*ارتفاع/);

                const toNum = (s: string) => parseFloat(s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()));
                if (wMatch) width = toNum(wMatch[1]);
                if (dMatch) depth = toNum(dMatch[1]);
                if (hMatch) height = toNum(hMatch[1]);

                if (!width || !depth || !height) {
                    const multiMatch = dimStr.match(/([۰-۹0-9.]+)\s*[×*×]\s*([۰-۹0-9.]+)\s*[×*×]\s*([۰-۹0-9.]+)/);
                    if (multiMatch) {
                        width = toNum(multiMatch[1]);
                        depth = toNum(multiMatch[2]);
                        height = toNum(multiMatch[3]);
                    }
                }
            } else if (line.includes('وزن')) {
                const wStr = line.replace(/.*وزن:?\s*/, '').trim();
                specs['وزن'] = wStr;
                const match = wStr.match(/([۰-۹0-9.]+)/);
                if (match) {
                    weightNet = parseFloat(match[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()));
                }
            } else if (line.includes('توان همزن')) {
                specs['توان همزن'] = line.replace(/.*توان همزن:?\s*/, '').trim();
            } else if (line.includes('قابلیت')) {
                const cap = line.replace(/.*قابلیت:?\s*/, '').trim();
                features.push(cap);
            } else if (line.startsWith('🔎 کلمات کلیدی:') || line.startsWith('کلمات کلیدی:')) {
                const kwStr = line.replace(/.*کلمات کلیدی:\s*/, '').trim();
                keywords = kwStr.split(/[،,]/).map(k => k.trim()).filter(Boolean);
            } else if (line.startsWith('📍 توضیحات:') || line.startsWith('توضیحات:')) {
                description = line.replace(/.*توضیحات:\s*/, '').trim();
            } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                const feat = line.replace(/^[•\-*📍\s]+/, '').trim();
                if (feat && !feat.startsWith('برند') && !feat.startsWith('مدل')) {
                    features.push(feat);
                }
            }
        }

        // Infer brand from cleanTitle if not explicit
        if (!brand) {
            if (cleanTitle.includes('نیکنام')) brand = 'نیکنام';
            else if (cleanTitle.includes('شمس')) brand = 'شمس';
            else if (cleanTitle.includes('البرز ماشین')) brand = 'البرز ماشین';
            else if (cleanTitle.includes('البرز')) brand = 'البرز';
            else if (cleanTitle.includes('SPM') || cleanTitle.includes('اس پی ام')) brand = 'SPM';
            else if (cleanTitle.includes('بابک ماشین')) brand = 'بابک ماشین';
            else brand = 'آیس سنتر';
        }

        // Infer Subcategory ID
        let subcategoryId = 26; // Default: Soft Serve Ice Cream general
        if (cleanTitle.includes('بارسفت') || cleanTitle.includes('بار سفت')) {
            subcategoryId = 27; // Batch Freezer
        } else if (cleanTitle.includes('شربت سردکن') || cleanTitle.includes('شربت سرد کن')) {
            subcategoryId = 5; // Drink Dispenser
        } else if (cleanTitle.includes('یخ در بهشت')) {
            subcategoryId = 4; // Slush Machine
        } else if (cleanTitle.includes('آب مرکبات') || cleanTitle.includes('آب پرتقال')) {
            subcategoryId = 1; // Citrus Juicer
        }

        if (!description) {
            description = `${cleanTitle} با کیفیت ساخت فوق‌العاده، بدنه مقاوم و عملکرد بهینه جهت استفاده صنعتی و کارگاهی.`;
        }

        parsedList.push({
            num: itemNum,
            rawTitle: cleanTitle,
            name: cleanTitle,
            brand,
            model,
            phase,
            voltage,
            power,
            width,
            depth,
            height,
            weightNet,
            subcategoryId,
            specifications: specs,
            features,
            keywords,
            description,
        });
    }

    return parsedList;
}

async function main() {
    // Reset sequence for autoincrement ID in PostgreSQL
    try {
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Product"', 'id'), COALESCE((SELECT MAX(id) FROM "Product"), 1));`);
    } catch {
        // Fallback
    }

    const parsedProducts = parseProductsTxt();
    console.log(`📋 Parsed ${parsedProducts.length} unique products from products.txt\n`);

    const existingProducts = await prisma.product.findMany({
        select: { id: true, name: true, brand: true, model: true, subcategoryId: true }
    });

    let addedCount = 0;
    let updatedCount = 0;
    const doubtList: Array<{ num: number; name: string; reason: string }> = [];

    for (const p of parsedProducts) {
        // Check if matching product already exists in DB
        const match = existingProducts.find(ex => {
            const exName = ex.name.trim();
            const pName = p.name.trim();
            if (exName === pName) return true;
            if (p.brand && ex.brand && p.model && ex.model) {
                if (ex.brand.includes(p.brand) && ex.model.includes(p.model)) return true;
            }
            return false;
        });

        if (match) {
            console.log(`🔄 Updating existing product ID ${match.id}: "${match.name}"`);
            await prisma.product.update({
                where: { id: match.id },
                data: {
                    brand: p.brand || match.brand,
                    model: p.model || match.model,
                    phase: p.phase ?? undefined,
                    voltage: p.voltage ?? undefined,
                    power: p.power ?? undefined,
                    coolingSystem: 'AIR',
                    width: p.width ?? undefined,
                    depth: p.depth ?? undefined,
                    height: p.height ?? undefined,
                    weightNet: p.weightNet ?? undefined,
                    specifications: p.specifications,
                    features: p.features.length > 0 ? p.features : undefined,
                    keywords: p.keywords.length > 0 ? p.keywords : undefined,
                    description: p.description,
                }
            });
            updatedCount++;
        } else {
            const slug = await getUniqueSlug(p.name);
            console.log(`➕ Adding new product #${p.num}: "${p.name}" (Subcategory: ${p.subcategoryId})`);

            await prisma.product.create({
                data: {
                    name: p.name,
                    slug,
                    brand: p.brand,
                    model: p.model,
                    manufacturingCountry: 'ایران',
                    condition: 'NEW',
                    price: 0, // baseline price 0 for editing later
                    stock: 10,
                    inventoryStatus: 'IN_STOCK',
                    isActive: true,
                    featured: false,
                    powerSource: 'ELECTRIC',
                    voltage: p.voltage,
                    phase: p.phase,
                    power: p.power,
                    coolingSystem: 'AIR',
                    width: p.width,
                    depth: p.depth,
                    height: p.height,
                    weightNet: p.weightNet,
                    thumbnail: null, // As explicitly requested
                    images: [],     // As explicitly requested
                    subcategoryId: p.subcategoryId,
                    specifications: p.specifications,
                    features: p.features.length > 0 ? p.features : ['کیفیت ساخت عالی', 'گارانتی معتبر', 'پشتیبانی تخصصی آیس سنتر'],
                    keywords: p.keywords.length > 0 ? p.keywords : [p.name, p.brand, 'تجهیزات صنعتی'],
                    description: p.description,
                }
            });
            addedCount++;
        }

        // Check if there are doubts about data parsing (e.g. missing dimensions or weight)
        if (!p.width || !p.height || !p.weightNet) {
            doubtList.push({
                num: p.num,
                name: p.name,
                reason: `ابعاد یا وزن به صورت عددی مجزا استخراج نشد (در مشخصات تکمیلی قرار گرفت)`
            });
        }
    }

    console.log(`\n========================================`);
    console.log(`✅ Import finished successfully!`);
    console.log(`- New products added: ${addedCount}`);
    console.log(`- Existing products updated: ${updatedCount}`);
    console.log(`- Total processed: ${parsedProducts.length}`);
    console.log(`========================================\n`);

    if (doubtList.length > 0) {
        console.log(`⚠️ List of products with missing exact numerical specs (placed in general specifications):`);
        doubtList.forEach(d => console.log(`  - [#${d.num}] ${d.name}`));
    }

    await prisma.$disconnect();
    await pool.end();
}

main().catch(err => {
    console.error('Fatal error during import:', err);
    process.exit(1);
});
