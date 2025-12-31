const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

let prisma = null;

function normalizeEnv() {
    if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL =
            process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL || '';
    }
}

function parseHeaderAndMeta(raw) {
    const lines = raw.replace(/\r\n/g, '\n').split('\n');
    let index = 0;

    const nextNonEmpty = () => {
        while (index < lines.length && lines[index].trim() === '') {
            index += 1;
        }
        return lines[index];
    };

    const title = nextNonEmpty();
    if (!title) {
        throw new Error('Missing title line.');
    }
    index += 1;

    const slug = nextNonEmpty();
    if (!slug) {
        throw new Error('Missing slug line.');
    }
    index += 1;

    const summary = nextNonEmpty();
    if (!summary) {
        throw new Error('Missing summary line.');
    }
    index += 1;

    const separatorIndex = lines.findIndex(
        (line, idx) => idx >= index && line.trim() === '---'
    );

    const bodyLines =
        separatorIndex === -1
            ? lines.slice(index)
            : lines.slice(index, separatorIndex);

    const metaLines =
        separatorIndex === -1
            ? []
            : lines
                  .slice(separatorIndex + 1)
                  .map((line) => line.trim())
                  .filter(Boolean);

    return {
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim(),
        coverImage: metaLines[0],
        seoTitle: metaLines[1],
        seoDescription: metaLines[2],
        keywords: metaLines[3]
            ? metaLines[3]
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
            : [],
        bodyLines,
    };
}

function parseInline(text) {
    const nodes = [];
    const regex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match = null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const plain = text.slice(lastIndex, match.index);
            if (plain) {
                nodes.push({ type: 'text', text: plain });
            }
        }

        const boldText = match[1];
        if (boldText) {
            nodes.push({
                type: 'text',
                text: boldText,
                marks: [{ type: 'bold' }],
            });
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        const rest = text.slice(lastIndex);
        if (rest) {
            nodes.push({ type: 'text', text: rest });
        }
    }

    if (nodes.length === 0) {
        nodes.push({ type: 'text', text });
    }

    return nodes;
}

async function parseBodyToBlocks(lines) {
    const blocks = [];
    let index = 0;

    const isHeading = (line) => /^#{1,6}\s+/.test(line.trim());
    const isListItem = (line) => /^(\*|-)\s+/.test(line.trim());
    const isProductSlug = (line) => /^slug:\s*\S+/i.test(line.trim());

    while (index < lines.length) {
        const rawLine = lines[index];
        const line = rawLine.trim();

        if (line === '') {
            index += 1;
            continue;
        }

        if (isHeading(line)) {
            const match = line.match(/^(#{1,6})\s+(.*)$/);
            const level = match ? match[1].length : 2;
            const text = match ? match[2].trim() : line.replace(/^#+\s+/, '');
            blocks.push({
                type: 'heading',
                attrs: { level },
                content: parseInline(text),
            });
            index += 1;
            continue;
        }

        if (isListItem(line)) {
            const items = [];
            while (index < lines.length && isListItem(lines[index])) {
                const itemLine = lines[index]
                    .trim()
                    .replace(/^(\*|-)\s+/, '');
                items.push({
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: parseInline(itemLine),
                        },
                    ],
                });
                index += 1;
            }
            blocks.push({ type: 'bulletList', content: items });
            continue;
        }

        if (isProductSlug(line)) {
            const slug = line.replace(/^slug:\s*/i, '').trim();
            console.log(`Resolving product slug: ${slug}`);
            const product = await prisma.product.findUnique({
                where: { slug },
            });
            blocks.push({
                type: 'productBlock',
                attrs: {
                    productSlug: slug,
                    productName: product ? product.name : undefined,
                    productImage: product
                        ? product.thumbnail || product.images?.[0]
                        : undefined,
                    productPrice: product ? product.price : 0,
                },
            });
            index += 1;
            continue;
        }

        const paragraphLines = [];
        while (index < lines.length) {
            const current = lines[index];
            const trimmed = current.trim();
            if (
                trimmed === '' ||
                isHeading(trimmed) ||
                isListItem(trimmed) ||
                isProductSlug(trimmed)
            ) {
                break;
            }
            paragraphLines.push(trimmed);
            index += 1;
        }

        if (paragraphLines.length > 0) {
            blocks.push({
                type: 'paragraph',
                content: parseInline(paragraphLines.join(' ')),
            });
        }
    }

    return blocks;
}

async function main() {
    normalizeEnv();

    const filePath = process.argv[2]
        ? path.resolve(process.argv[2])
        : path.resolve('blog-content.txt');

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    console.log(`Reading content from ${filePath}`);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = parseHeaderAndMeta(raw);

    const connectionString =
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.PRISMA_DATABASE_URL;

    if (!connectionString) {
        throw new Error('Missing DATABASE_URL/POSTGRES_URL/PRISMA_DATABASE_URL');
    }

    const pool = new Pool({ connectionString, connectionTimeoutMillis: 10000 });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
    console.log('Building content blocks...');
    const contentBlocks = await parseBodyToBlocks(parsed.bodyLines);

    console.log('Fetching admin user...');
    const admin = await prisma.admin.findFirst();

    const payload = {
        title: parsed.title,
        slug: parsed.slug,
        summary: parsed.summary,
        coverImage: parsed.coverImage,
        content: { type: 'doc', content: contentBlocks },
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        keywords: parsed.keywords,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: admin ? admin.id : undefined,
    };

    console.log('Saving blog post...');
    const post = await prisma.blogPost.upsert({
        where: { slug: parsed.slug },
        update: payload,
        create: payload,
    });

    console.log(`✅ Blog post created/updated: ${post.slug}`);
}

main()
    .catch((error) => {
        console.error('❌ Failed to import blog post:', error);
        process.exit(1);
    })
    .finally(async () => {
        if (prisma) {
            await prisma.$disconnect();
        }
    });
