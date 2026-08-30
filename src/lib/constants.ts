/**
 * Shared cross-route validation constants.
 * Single source of truth so cart routes can't drift apart.
 */

/** Maximum quantity per cart line item (enforced in cart add/update/sync routes) */
export const MAX_QUANTITY_PER_ITEM = 100;

/** Maximum number of items accepted by POST /api/cart/sync (localStorage merge) */
export const MAX_SYNC_ITEMS = 50;
