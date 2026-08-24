import { suite, it } from './runner';
import assert from 'node:assert/strict';
import { resolveUnitPrice } from '../src/lib/offers/pricing';

suite('Batch1 #13 — order unit price is nullish-safe', () => {
    it('a legitimate effectivePrice of 0 (100% offer) stays 0 — no fallback to full price', () => {
        assert.equal(resolveUnitPrice({ effectivePrice: 0 }, 900000), 0);
    });

    it('uses the fetched effective price when present', () => {
        assert.equal(resolveUnitPrice({ effectivePrice: 12345 }, 999999), 12345);
    });

    it('falls back to product price only when priceInfo row is missing (undefined/null)', () => {
        assert.equal(resolveUnitPrice(undefined, 900000), 900000);
        assert.equal(resolveUnitPrice(null, 900000), 900000);
    });
});
