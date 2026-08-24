import { suite, it } from './runner';
import assert from 'node:assert/strict';
import { tomanToIrr } from '../src/lib/seo/currency';
import { generateProductSchemaJsonLd } from '../src/lib/seo/product-jsonld';
import { generateProductJsonLd } from '../src/lib/seo/jsonld';

suite('Batch 2 B1 — JSON-LD IRR Currency Conversion', () => {
    it('tomanToIrr multiplies Toman by 10 to get Rials', () => {
        assert.equal(tomanToIrr(1000), 10000);
        assert.equal(tomanToIrr(50000000), 500000000);
        assert.equal(tomanToIrr(0), 0);
    });

    it('generateProductSchemaJsonLd emits price in IRR', () => {
        const schema = generateProductSchemaJsonLd({
            name: 'دستگاه بستنی قیفی',
            slug: 'soft-ice-machine',
            description: 'توضیحات دستگاه',
            price: 50000000, // 50 million Toman
            images: [],
            brand: 'Ice Master',
            warranty: '18 ماه گارانتی',
            rating: 5,
            reviewCount: 12,
            inventoryStatus: 'IN_STOCK',
            categoryName: 'تجهیزات برودتی',
            subcategoryName: 'دستگاه بستنی',
        });

        const offers = schema.offers as { price: number; priceCurrency: string };
        assert.equal(offers.priceCurrency, 'IRR');
        assert.equal(offers.price, 500000000); // 500 million Rials
    });

    it('generateProductJsonLd (collection item) emits price in IRR', () => {
        const schema = generateProductJsonLd({
            name: 'یخچال صنعتی',
            slug: 'industrial-fridge',
            price: 25000000, // 25 million Toman
            inventoryStatus: 'IN_STOCK',
        });

        const offers = schema.offers as { price: number; priceCurrency: string };
        assert.equal(offers.priceCurrency, 'IRR');
        assert.equal(offers.price, 250000000); // 250 million Rials
    });
});
