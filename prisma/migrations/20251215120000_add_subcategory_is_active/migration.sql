-- Add isActive flag for Subcategory to match application queries
ALTER TABLE "Subcategory" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Subcategory_isActive_idx" ON "Subcategory"("isActive");
