-- Finding #12: Migrate all monetary fields from Float (DOUBLE PRECISION) to Decimal(14, 2)
-- This migration preserves all existing data and ensures exact decimal arithmetic for financial operations.

-- AlterTable
ALTER TABLE "Coupon" ALTER COLUMN "value" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "minOrderAmount" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "maxDiscount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "CouponUsage" ALTER COLUMN "discount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "Offer" ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "maxDiscountCap" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "OfferProduct" ALTER COLUMN "customDiscountValue" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "shippingCost" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "listPrice" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "price" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "listPrice" SET DATA TYPE DECIMAL(14,2);
