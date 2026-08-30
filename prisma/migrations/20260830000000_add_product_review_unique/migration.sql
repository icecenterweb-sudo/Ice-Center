-- Group 1a: Enforce one review per user per product at the DB level.
-- Closes the duplicate-submission race in POST /api/products/[id]/reviews
-- where two concurrent requests could both pass the findFirst check.
-- The API handler now maps the resulting P2002 error to a clean 409.

ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_userId_key" UNIQUE ("productId", "userId");
