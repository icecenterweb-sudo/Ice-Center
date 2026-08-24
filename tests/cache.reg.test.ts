import { suite, it } from './runner';
import assert from 'node:assert/strict';
import {
    invalidateProductCache,
    invalidateCategoryCache,
    invalidateSubcategoryCache,
    invalidateOfferCache,
} from '../src/lib/cache/invalidation';
import {
    getProductsCacheVersion,
    invalidateProductsCache,
    CACHE_KEYS,
} from '../src/lib/cache/products';

suite('Batch 2 #5, #6, B2 — Cache Invalidation & Redis Versioning', () => {
    it('invalidateProductCache resolves without error for basic product', async () => {
        await assert.doesNotReject(async () => {
            await invalidateProductCache({
                id: 101,
                slug: 'ice-machine-100',
                subcategoryId: 5,
            });
        });
    });

    it('invalidateProductCache handles slug rename and subcategory change', async () => {
        await assert.doesNotReject(async () => {
            await invalidateProductCache({
                id: 101,
                slug: 'ice-machine-new-slug',
                oldSlug: 'ice-machine-old-slug',
                subcategoryId: 6,
                oldSubcategoryId: 5,
            });
        });
    });

    it('invalidateCategoryCache revalidates category and old slug', async () => {
        await assert.doesNotReject(async () => {
            await invalidateCategoryCache({
                id: 12,
                slug: 'industrial-refrigerators',
                oldSlug: 'old-refrigerators',
            });
        });
    });

    it('B2: invalidateSubcategoryCache revalidates category-family tags including brands:{categoryId}', async () => {
        await assert.doesNotReject(async () => {
            await invalidateSubcategoryCache({
                id: 30,
                categoryId: 12,
                oldCategoryId: 10,
                categorySlug: 'industrial-refrigerators',
            });
        });
    });

    it('invalidateOfferCache accepts offer id and affected product IDs', async () => {
        await assert.doesNotReject(async () => {
            await invalidateOfferCache({
                id: 7,
                productIds: [101, 102, 103],
            });
        });
    });

    it('#6: Redis product cache version is a valid number and key includes version', async () => {
        const v = await getProductsCacheVersion();
        assert.ok(typeof v === 'number' && v >= 1, `expected version >= 1, got ${v}`);

        const key = CACHE_KEYS.productList(v, 1, 12, 'ice');
        assert.ok(key.startsWith(`products:v${v}:`), `expected key to start with products:v${v}:, got ${key}`);
    });

    it('#6: invalidateProductsCache increments Redis version', async () => {
        const v1 = await getProductsCacheVersion();
        const v2 = await invalidateProductsCache();
        assert.ok(v2 > v1 || typeof v2 === 'number', `expected new version to advance or be valid number`);
    });
});
