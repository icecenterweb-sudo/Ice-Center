/**
 * Shared Schema.org availability mapper (single source of truth for JSON-LD).
 */
export function getAvailabilitySchema(status: string): string {
    switch (status) {
        case 'IN_STOCK':
            return 'https://schema.org/InStock';
        case 'LOW_STOCK':
            return 'https://schema.org/LimitedAvailability';
        case 'OUT_OF_STOCK':
            return 'https://schema.org/OutOfStock';
        case 'PRE_ORDER':
            return 'https://schema.org/PreOrder';
        case 'DISCONTINUED':
            return 'https://schema.org/Discontinued';
        default:
            return 'https://schema.org/InStock';
    }
}
