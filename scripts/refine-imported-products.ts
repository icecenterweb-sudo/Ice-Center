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

function cleanStr(s: string): string {
    return s.replace(/^مشخصات\s+/, '').replace(/^📌\s*عنوان:\s*/, '').replace(/^📍\s*عنوان:\s*/, '').trim();
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

        // Parse Item Number
        let itemNum = 0;
        let titleLine = '';

        for (let i = 0; i < lines.length; i++) {
            const m = lines[i].match(/^([۰-۹0-9]+)\s*[-–]?/);
            if (m && parseInt(m[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10) > 0) {
                itemNum = parseInt(m[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()), 10);
                titleLine = lines[i];
                // If title is on next line (e.g. "۲۵-📌 عنوان:" followed by title line)
                if ((titleLine.includes('عنوان:') || titleLine.endsWith('-')) && i + 1 < lines.length) {
                    if (lines[i + 1].includes('عنوان:')) {
                        titleLine = lines[i + 1];
                    } else if (!lines[i + 1].includes(':')) {
                        titleLine = lines[i + 1];
                    }
                }
                break;
            }
        }

        // Avoid duplicate item numbers from the file (like the second #31)
        if (itemNum && seenNumbers.has(itemNum)) {
            console.log(`[Skip Duplicate in Text] Item #${itemNum} already processed.`);
            continue;
        }
        if (itemNum) seenNumbers.add(itemNum);

        // Clean title
        let rawTitle = titleLine.replace(/^([۰-۹0-9]+)\s*[-–]?\s*/, '').trim();
        rawTitle = cleanStr(rawTitle);

        if (!rawTitle) {
            // Fallback find first non-key line
            for (const l of lines) {
                if (!l.includes(':') && !l.startsWith('📌') && !l.startsWith('📍')) {
                    rawTitle = cleanStr(l.replace(/^([۰-۹0-9]+)\s*[-–]\s*/, ''));
                    if (rawTitle) break;
                }
            }
        }

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
            if (line.includes('برند:') || line.startsWith('برند')) {
                brand = line.replace(/.*برند:?\s*/, '').trim();
            } else if (line.includes('مدل:') || line.startsWith('مدل')) {
                model = line.replace(/.*مدل:?\s*/, '').trim();
            } else if (line.includes('فاز') || line.includes('برق')) {
                const val = line.replace(/.*(برق|فاز|برق مصرفی):?\s*/, '').trim();
                specs['برق مصرفی'] = val;
                if (val.includes('سه فاز') || val.includes('۳ فاز') || val.includes('380')) {
                    phase = 3;
                    voltage = '۳۸۰ ولت';
                } else if (val.includes('تک فاز') || val.includes('۱ فاز') || val.includes('220')) {
                    phase = 1;
                    voltage = '۲۲۰ ولت';
                }
            } else if (line.includes('توان کمپرسور') || (line.includes('کمپرسور') && line.includes('اسب'))) {
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

                const toNum = (s: string) => parseFloat(s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()));
                const wMatch = dimStr.match(/(?:عرض|W)\s*[:\s]*([۰-۹0-9.]+)/i) || dimStr.match(/([۰-۹0-9.]+)\s*عرض/);
                const dMatch = dimStr.match(/(?:عمق|D)\s*[:\s]*([۰-۹0-9.]+)/i) || dimStr.match(/([۰-۹0-9.]+)\s*عمق/);
                const hMatch = dimStr.match(/(?:ارتفاع|H)\s*[:\s]*([۰-۹0-9.]+)/i) || dimStr.match(/([۰-۹0-9.]+)\s*ارتفاع/);

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

        // Brand inference
        if (!brand) {
            if (rawTitle.includes('نیکنام')) brand = 'نیکنام';
            else if (rawTitle.includes('شمس')) brand = 'شمس';
            else if (rawTitle.includes('البرز ماشین')) brand = 'البرز ماشین';
            else if (rawTitle.includes('البرز')) brand = 'البرز';
            else if (rawTitle.includes('SPM') || rawTitle.includes('اس پی ام')) brand = 'SPM';
            else if (rawTitle.includes('بابک ماشین')) brand = 'بابک ماشین';
            else if (rawTitle.includes('هلال')) brand = 'هلال';
            else if (rawTitle.includes('ICN') || rawTitle.includes('ای سی ان')) brand = 'ICN';
            else brand = 'آیس سنتر';
        }

        // Subcategory ID inference
        let subcategoryId = 26; // Soft Serve Ice Cream General
        const normalizedTitle = rawTitle.replace(/[\s\u200c]+/g, ' ');

        if (normalizedTitle.includes('بارسفت') || normalizedTitle.includes('بار سفت')) {
            subcategoryId = 27; // Batch Freezer
        } else if (normalizedTitle.includes('شربت سردکن') || normalizedTitle.includes('شربت سرد کن')) {
            subcategoryId = 5; // Drink Dispenser
        } else if (normalizedTitle.includes('یخ در بهشت')) {
            subcategoryId = 4; // Slush Machine
        } else if (normalizedTitle.includes('آب هویج') || normalizedTitle.includes('آبمیوه')) {
            subcategoryId = 2; // Juice Extractor (آبمیوه گیری)
        } else if (normalizedTitle.includes('آب مرکبات') || normalizedTitle.includes('آب پرتقال')) {
            subcategoryId = 1; // Citrus Juicer (آب مرکبات گیری)
        }

        if (!description) {
            description = `${rawTitle} با کیفیت ساخت عالی، بدنه استیل مقاوم و کارکرد صنعتی جهت استفاده در فروشگاه‌ها، کافی‌شاپ‌ها و آبمیوه‌فروشی‌ها.`;
        }

        parsedList.push({
            num: itemNum,
            name: rawTitle,
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
    // Delete newly added empty or broken products from previous test run
    await prisma.product.deleteMany({
        where: {
            OR: [
                { name: '' },
                { name: { contains: '۲۴دستگاه' } },
            ]
        }
    });

    const parsedProducts = parseProductsTxt();
    console.log(`📋 Clean Parsed ${parsedProducts.length} products from products.txt\n`);

    const existingProducts = await prisma.product.findMany({
        select: { id: true, name: true, brand: true, model: true, subcategoryId: true }
    });

    let addedCount = 0;
    let updatedCount = 0;
    const doubtList: Array<{ num: number; name: string; reason: string }> = [];

    for (const p of parsedProducts) {
        if (!p.name) {
            console.error(`⚠️ Skipping invalid empty name item #${p.num}`);
            continue;
        }

        // Check match in DB by exact name only
        const match = existingProducts.find(ex => {
            const exName = ex.name.replace(/[\s\u200c]+/g, ' ').trim();
            const pName = p.name.replace(/[\s\u200c]+/g, ' ').trim();
            return exName === pName;
        });

        if (match) {
            console.log(`🔄 Updating existing product ID ${match.id}: "${p.name}"`);
            await prisma.product.update({
                where: { id: match.id },
                data: {
                    name: p.name,
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
                    subcategoryId: p.subcategoryId,
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
                    price: 0,
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
                    thumbnail: null,
                    images: [],
                    subcategoryId: p.subcategoryId,
                    specifications: p.specifications,
                    features: p.features.length > 0 ? p.features : ['کیفیت ساخت عالی', 'گارانتی معتبر', 'پشتیبانی تخصصی آیس سنتر'],
                    keywords: p.keywords.length > 0 ? p.keywords : [p.name, p.brand, 'تجهیزات صنعتی'],
                    description: p.description,
                }
            });
            addedCount++;
        }

        if (!p.width || !p.height || !p.weightNet) {
            doubtList.push({
                num: p.num,
                name: p.name,
                reason: `ابعاد یا وزن به صورت عدد مجزا استخراج نشد (در متن مشخصات قرار داده شد)`
            });
        }
    }

    console.log(`\n========================================`);
    console.log(`✅ Refined Import finished successfully!`);
    console.log(`- New products added: ${addedCount}`);
    console.log(`- Existing products updated: ${updatedCount}`);
    console.log(`- Total processed: ${parsedProducts.length}`);
    console.log(`========================================\n`);

    console.log(`📋 Doubts Check List (${doubtList.length} items with missing numerical dimensions/weight):`);
    doubtList.forEach(d => console.log(`  [#${d.num}] ${d.name}`));

    await prisma.$disconnect();
    await pool.end();
}

main().catch(err => {
    console.error('Fatal error during refine import:', err);
    process.exit(1);
});
