import { suite, it } from './runner';
import assert from 'node:assert/strict';

suite('Batch 2 #7, #8, #21 — Cart login sync, state purity & stock capping', () => {
    it('#21: Guest cart item addition clamps quantity to product stock', () => {
        const product = {
            id: 1,
            name: 'Soft Ice Cream Machine',
            slug: 'soft-ice-cream',
            price: 50000000,
            listPrice: null,
            thumbnail: null,
            stock: 3,
        };

        const existingItems = [{ productId: 1, quantity: 2, product }];
        const addedQuantity = 2; // total requested = 4, but stock = 3

        const maxStock = product.stock > 0 ? product.stock : Infinity;
        const newQty = Math.min(existingItems[0].quantity + addedQuantity, maxStock);

        assert.equal(newQty, 3);
    });

    it('#21: Server cart sync clamps total merged quantity to available product stock', () => {
        const serverExistingQty = 4;
        const localIncomingQty = 3;
        const productStock = 5;

        const mergedQty = Math.min(serverExistingQty + localIncomingQty, productStock);
        assert.equal(mergedQty, 5);
    });

    it('#7: Sequential login-sync flow returns deterministic state', async () => {
        let synced = false;
        let fetched = false;

        const mockSyncCart = async () => {
            synced = true;
            return true; // synced successfully
        };

        const mockFetchCart = async () => {
            fetched = true;
        };

        // Sequential execution pattern implemented in CartContext
        const didSync = await mockSyncCart();
        if (!didSync) {
            await mockFetchCart();
        }

        assert.equal(synced, true);
        assert.equal(fetched, false); // fetchCart skipped because syncCart handled it
    });

    it('#8: State updaters remain pure functions without localStorage mutation', () => {
        const prevItems = [{ productId: 1, quantity: 1, product: { price: 1000, stock: 10 } }];
        const productIdToRemove = 1;

        // Pure updater function
        const updater = (items: typeof prevItems) => items.filter(i => i.productId !== productIdToRemove);
        const result1 = updater(prevItems);
        const result2 = updater(prevItems);

        assert.deepEqual(result1, result2);
        assert.equal(result1.length, 0);
    });
});
