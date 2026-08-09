/**
 * Fix Missing Images (ALL entities)
 * =================================
 *
 * Superset of fix-missing-product-images.ts. Repairs image paths across EVERY
 * image-bearing table in the database — not just products — that no longer
 * match the physical files on disk. Same root cause everywhere: the DB points
 * at `/uploads/.../x.jpg` but the file was re-encoded to `x.webp` (by
 * convert-to-webp.ts) or renamed, so the storefront returns 404.
 *
 * Tables & fields covered:
 *   Category      -> image
 *   Product       -> thumbnail, images[]
 *   Slide         -> desktopImage, mobileImage
 *   Banner        -> desktopImage, mobileImage
 *   BlogPost      -> coverImage, thumbnail
 *   BlogCategory  -> image
 *
 * Resolution order per image (first hit wins):
 *   1. exact match (already correct)                          -> ok
 *   2. same base name, different extension (.jpg -> .webp)    -> remapped
 *      (also catches a file relocated within /uploads/)
 *   3. strong fuzzy: disk file base name == row slug/name     -> fuzzy
 *   4. (product thumbnail only) first valid gallery image     -> from gallery
 *   5. (product thumbnail only) --placeholder path            -> placeholder
 *   else: left untouched and reported as "unresolved"
 *
 * SAFETY: dry run by default. Required (non-null) single fields such as
 * Slide.desktopImage are NEVER blanked — if unresolved they keep their old
 * value and are reported. Nothing is written unless you pass --apply.
 *
 * Usage:
 *   npx tsx scripts/fix-missing-images.ts                     # dry run, all tables
 *   npx tsx scripts/fix-missing-images.ts --apply             # apply
 *   npx tsx scripts/fix-missing-images.ts --only slide,banner # limit to some tables
 *   npx tsx scripts/fix-missing-images.ts --all               # include inactive rows
 *   npx tsx scripts/fix-missing-images.ts --apply --placeholder /uploads/products/xyz.webp
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// --------------------------------------------------------------------------
// CLI flags
// --------------------------------------------------------------------------
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const INCLUDE_INACTIVE = args.includes('--all');
const ENABLE_FUZZY = !args.includes('--no-fuzzy');
const PLACEHOLDER = (() => {
    const i = args.indexOf('--placeholder');
    return i !== -1 && args[i + 1] ? args[i + 1] : null;
})();
const ONLY = (() => {
    const i = args.indexOf('--only');
    return i !== -1 && args[i + 1] ? args[i + 1].toLowerCase().split(',').map((s) => s.trim()) : null;
})();

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const IMAGE_EXTS = ['.webp', '.png', '.jpg', '.jpeg', '.avif', '.gif'];

// --------------------------------------------------------------------------
// DB (same convention as the rest of the repo)
// --------------------------------------------------------------------------
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
    console.error('❌ CRITICAL: POSTGRES_URL or DATABASE_URL is not set in the environment.');
    process.exit(1);
}
const ssl = connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined;
const pool = new Pool({ connectionString, ssl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --------------------------------------------------------------------------
// Target table definitions
// --------------------------------------------------------------------------
interface Target {
    model: string;                 // prisma delegate name (prisma[model])
    label: string;
    single: string[];              // single-value image fields
    arrays: string[];              // array image fields
    nameField: string | null;      // used for fuzzy matching + reporting
    activeWhere: Record<string, unknown> | null; // filter when NOT --all
}

const ALL_TARGETS: Target[] = [
    { model: 'category', label: 'Category', single: ['image'], arrays: [], nameField: 'slug', activeWhere: null },
    { model: 'product', label: 'Product', single: ['thumbnail'], arrays: ['images'], nameField: 'slug', activeWhere: { isActive: true } },
    { model: 'slide', label: 'Slide', single: ['desktopImage', 'mobileImage'], arrays: [], nameField: 'title', activeWhere: { isActive: true } },
    { model: 'banner', label: 'Banner', single: ['desktopImage', 'mobileImage'], arrays: [], nameField: 'title', activeWhere: { isActive: true } },
    { model: 'blogPost', label: 'BlogPost', single: ['coverImage', 'thumbnail'], arrays: [], nameField: 'slug', activeWhere: null },
    { model: 'blogCategory', label: 'BlogCategory', single: ['image'], arrays: [], nameField: 'slug', activeWhere: null },
];

const TARGETS = ONLY ? ALL_TARGETS.filter((t) => ONLY.includes(t.model.toLowerCase())) : ALL_TARGETS;

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
function toRelUrl(absPath: string): string {
    return '/' + path.relative(PUBLIC_DIR, absPath).split(path.sep).join('/');
}
function isExternal(p: string): boolean {
    return /^https?:\/\//i.test(p);
}
function existsOnDisk(relUrl: string): boolean {
    const rel = relUrl.startsWith('/') ? relUrl.slice(1) : relUrl;
    try { return fs.existsSync(path.join(PUBLIC_DIR, rel)); } catch { return false; }
}
function baseKey(relUrl: string): string {
    const b = relUrl.split('/').pop() || relUrl;
    const ext = path.extname(b);
    return (ext ? b.slice(0, -ext.length) : b).toLowerCase();
}
function fuzzyNorm(s: string): string {
    return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

// --------------------------------------------------------------------------
// Disk index over the WHOLE uploads tree
// --------------------------------------------------------------------------
interface DiskIndex {
    all: string[];
    byBase: Map<string, string[]>;
    byFuzzy: Map<string, string[]>;
}
function buildIndex(): DiskIndex {
    const all: string[] = [];
    const byBase = new Map<string, string[]>();
    const byFuzzy = new Map<string, string[]>();
    if (!fs.existsSync(UPLOADS_DIR)) {
        console.warn(`⚠️  Uploads dir not found: ${UPLOADS_DIR}`);
        return { all, byBase, byFuzzy };
    }
    const stack: string[] = [UPLOADS_DIR];
    while (stack.length) {
        const dir = stack.pop()!;
        let entries: fs.Dirent[] = [];
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) { stack.push(full); continue; }
            if (!IMAGE_EXTS.includes(path.extname(entry.name).toLowerCase())) continue;
            const rel = toRelUrl(full);
            all.push(rel);
            const bk = baseKey(rel);
            (byBase.get(bk) ?? byBase.set(bk, []).get(bk)!).push(rel);
            const fk = fuzzyNorm(bk);
            if (fk) (byFuzzy.get(fk) ?? byFuzzy.set(fk, []).get(fk)!).push(rel);
        }
    }
    return { all, byBase, byFuzzy };
}

/** Prefer a candidate in the same folder as the wanted path, then extension order. */
function pickBest(candidates: string[], wantedRel: string): string {
    const wantedDir = wantedRel.slice(0, wantedRel.lastIndexOf('/'));
    const rank = (c: string) => {
        const sameDir = c.slice(0, c.lastIndexOf('/')) === wantedDir ? 0 : 1;
        const extIdx = IMAGE_EXTS.indexOf(path.extname(c).toLowerCase());
        return sameDir * 100 + (extIdx === -1 ? 99 : extIdx);
    };
    return [...candidates].sort((a, b) => rank(a) - rank(b))[0];
}

type ResolveStatus = 'ok' | 'remapped' | 'fuzzy' | 'external' | 'missing';
interface ResolveResult { status: ResolveStatus; newPath: string | null; }

function resolveImage(dbPath: string | null | undefined, index: DiskIndex, name?: string | null): ResolveResult {
    if (!dbPath || typeof dbPath !== 'string' || !dbPath.trim()) return { status: 'missing', newPath: null };
    if (isExternal(dbPath)) return { status: 'external', newPath: dbPath };
    const rel = dbPath.startsWith('/') ? dbPath : '/' + dbPath;
    if (existsOnDisk(rel)) return { status: 'ok', newPath: rel };
    const byBaseHits = index.byBase.get(baseKey(rel));
    if (byBaseHits && byBaseHits.length) return { status: 'remapped', newPath: pickBest(byBaseHits, rel) };
    if (ENABLE_FUZZY && name) {
        const hits = index.byFuzzy.get(fuzzyNorm(name));
        if (hits && hits.length) return { status: 'fuzzy', newPath: pickBest(hits, rel) };
    }
    return { status: 'missing', newPath: null };
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
async function main() {
    console.log('====================================================');
    console.log('🛠️  FIX MISSING IMAGES (all entities)');
    console.log('====================================================');
    console.log(`Mode:        ${APPLY ? '💾 APPLY (will write to DB)' : '🔍 DRY RUN (no DB writes)'}`);
    console.log(`Rows:        ${INCLUDE_INACTIVE ? 'ALL (incl. inactive)' : 'active only (where applicable)'}`);
    console.log(`Fuzzy match: ${ENABLE_FUZZY ? 'on' : 'off'}`);
    console.log(`Tables:      ${TARGETS.map((t) => t.label).join(', ') || '(none matched --only)'}`);
    if (PLACEHOLDER) console.log(`Placeholder: ${PLACEHOLDER}`);
    console.log('');

    const index = buildIndex();
    console.log(`📁 Indexed ${index.all.length} image file(s) under /uploads/\n`);

    if (PLACEHOLDER && !existsOnDisk(PLACEHOLDER)) {
        console.error(`❌ --placeholder path does not exist on disk: ${PLACEHOLDER}`);
        return shutdown(1);
    }
    if (!TARGETS.length) {
        console.error('❌ No tables selected. Check your --only value.');
        return shutdown(1);
    }

    const grand = { fixed: 0, ok: 0, remapped: 0, fuzzy: 0, dropped: 0, unresolved: 0, written: 0, writeErrors: 0 };

    for (const t of TARGETS) {
        const delegate = (prisma as Record<string, any>)[t.model];
        if (!delegate) { console.warn(`⚠️  Unknown model '${t.model}', skipping.`); continue; }

        const select: Record<string, boolean> = { id: true };
        if (t.nameField) select[t.nameField] = true;
        for (const f of [...t.single, ...t.arrays]) select[f] = true;

        const where = !INCLUDE_INACTIVE && t.activeWhere ? t.activeWhere : {};
        const rows: any[] = await delegate.findMany({ where, select, orderBy: { id: 'asc' } });

        console.log(`\n=== ${t.label} (${rows.length} rows) ===`);
        let changedInTable = 0;
        const unresolved: string[] = [];

        for (const row of rows) {
            const name: string | null = t.nameField ? (row[t.nameField] ?? null) : null;
            const data: Record<string, unknown> = {};

            // Arrays first (so a product thumbnail can fall back to a fixed gallery image).
            const resolvedArrays: Record<string, string[]> = {};
            for (const field of t.arrays) {
                const oldArr: string[] = Array.isArray(row[field]) ? row[field] : [];
                const newArr: string[] = [];
                let dropped = 0;
                for (const img of oldArr) {
                    const r = resolveImage(img, index, name);
                    if (r.status === 'ok') { grand.ok++; newArr.push(r.newPath!); }
                    else if (r.status === 'external') { newArr.push(r.newPath!); }
                    else if (r.status === 'remapped') { grand.remapped++; newArr.push(r.newPath!); }
                    else if (r.status === 'fuzzy') { grand.fuzzy++; newArr.push(r.newPath!); }
                    else { grand.dropped++; dropped++; }
                }
                resolvedArrays[field] = newArr;
                const changed = newArr.length !== oldArr.length || newArr.some((v, i) => v !== oldArr[i]);
                if (changed) { data[field] = newArr; if (dropped) console.log(`   #${row.id} ${field}: ${dropped} broken image(s) dropped`); }
            }
            const galleryFallback = Object.values(resolvedArrays).flat().find((i) => !isExternal(i))
                ?? Object.values(resolvedArrays).flat()[0];

            // Single fields.
            for (const field of t.single) {
                const oldVal: string | null = row[field] ?? null;
                const r = resolveImage(oldVal, index, name);
                let newVal: string | null = oldVal;
                if (r.status === 'ok') { grand.ok++; newVal = r.newPath; }
                else if (r.status === 'external') { newVal = r.newPath; }
                else if (r.status === 'remapped') { grand.remapped++; newVal = r.newPath; }
                else if (r.status === 'fuzzy') { grand.fuzzy++; newVal = r.newPath; }
                else {
                    // Unresolved. Only fill product.thumbnail via gallery / placeholder.
                    const isProductThumb = t.model === 'product' && field === 'thumbnail';
                    if (isProductThumb && galleryFallback) { newVal = galleryFallback; }
                    else if (isProductThumb && PLACEHOLDER) { newVal = PLACEHOLDER; }
                    else {
                        // Never blank a value; leave as-is and report (unless it was already empty).
                        if (oldVal) { grand.unresolved++; unresolved.push(`#${row.id} ${name ?? ''} · ${field} = ${oldVal}`); }
                        newVal = oldVal;
                    }
                }
                if ((newVal ?? null) !== (oldVal ?? null)) {
                    data[field] = newVal;
                    console.log(`   #${row.id} ${field}: ${oldVal ?? '(none)'}  ->  ${newVal ?? '(none)'}`);
                }
            }

            if (Object.keys(data).length > 0) {
                changedInTable++;
                grand.fixed++;
                if (APPLY) {
                    try { await delegate.update({ where: { id: row.id }, data }); grand.written++; }
                    catch (e) { grand.writeErrors++; console.error(`   ❌ write failed #${row.id}:`, (e as Error).message); }
                }
            }
        }

        console.log(`   ${changedInTable === 0 ? '✅ nothing to fix' : `✏️  ${changedInTable} row(s) ${APPLY ? 'updated' : 'to update'}`}`);
        if (unresolved.length) {
            console.log(`   ❌ ${unresolved.length} unresolved (left untouched):`);
            unresolved.forEach((u) => console.log(`      - ${u}`));
        }
    }

    console.log('\n----------------------------------------------------');
    console.log('📊 GRAND TOTAL');
    console.log('----------------------------------------------------');
    console.log(`  ✅ already ok:      ${grand.ok}`);
    console.log(`  🔁 remapped:        ${grand.remapped}`);
    console.log(`  🔎 fuzzy:           ${grand.fuzzy}`);
    console.log(`  🗑️  dropped (404):   ${grand.dropped}`);
    console.log(`  ❌ unresolved:      ${grand.unresolved}`);
    console.log(`  ✏️  rows changed:    ${grand.fixed}`);
    if (APPLY) {
        console.log(`  💾 rows written:    ${grand.written}`);
        console.log(`  ❌ write errors:    ${grand.writeErrors}`);
    }

    if (!APPLY && grand.fixed > 0) {
        console.log('\n⚠️  DRY RUN. Re-run with --apply to write these fixes:');
        console.log('   npx tsx scripts/fix-missing-images.ts --apply');
    } else if (APPLY) {
        console.log('\n✅ Done. Revalidate / restart the app so the new paths are served.');
    }
    console.log('\n====================================================\n');
    return shutdown(0);
}

async function shutdown(code: number) {
    try { await prisma.$disconnect(); } catch {}
    try { await pool.end(); } catch {}
    process.exit(code);
}

main().catch(async (err) => {
    console.error('Fatal error:', err);
    await shutdown(1);
});
