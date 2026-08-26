-- Enable pg_trgm extension for fast trigram indexing on text columns (accelerates ILIKE / contains)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN trigram indexes on searched Product text columns
CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_brand_trgm_idx" ON "Product" USING gin ("brand" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_model_trgm_idx" ON "Product" USING gin ("model" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_description_trgm_idx" ON "Product" USING gin ("description" gin_trgm_ops);

-- Create GIN trigram index on searched Category name
CREATE INDEX IF NOT EXISTS "Category_name_trgm_idx" ON "Category" USING gin ("name" gin_trgm_ops);

-- Rollback Instructions (if needed):
-- DROP INDEX IF EXISTS "Product_name_trgm_idx";
-- DROP INDEX IF EXISTS "Product_brand_trgm_idx";
-- DROP INDEX IF EXISTS "Product_model_trgm_idx";
-- DROP INDEX IF EXISTS "Product_description_trgm_idx";
-- DROP INDEX IF EXISTS "Category_name_trgm_idx";
-- (Optionally) DROP EXTENSION IF EXISTS pg_trgm;
