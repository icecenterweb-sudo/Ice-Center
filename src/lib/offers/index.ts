/**
 * Offer System Library
 * 
 * Public exports for the Offer system
 */

// Pricing utilities
export {
    calculateEffectivePrice,
    isOfferActive,
    getOfferTimeRemaining,
    getEarliestEndDate,
    type OfferDiscount,
    type ProductPricing,
    type EffectivePricing,
} from './pricing';

// Database queries
export {
    getCarouselOffers,
    getProductWithActiveOffer,
    getCategoryProductsWithPrices,
    getCartItemPrices,
    updateProductOfferFlag,
    syncOfferFlags,
} from './queries';
