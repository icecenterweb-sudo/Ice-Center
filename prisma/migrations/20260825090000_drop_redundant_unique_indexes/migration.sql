-- Finding #32: Drop redundant single-column indexes that duplicate an
-- existing @unique constraint on the same column (Postgres already creates
-- a unique index for @unique). Keepers intentionally untouched:
--   OtpRequest.phone  (non-unique lookup)  -> OtpRequest_phone_idx
--   SupportRoom.phone (non-unique lookup)  -> SupportRoom_phone_idx

DROP INDEX IF EXISTS "Product_slug_idx";
DROP INDEX IF EXISTS "User_phone_idx";
DROP INDEX IF EXISTS "Admin_phone_idx";
DROP INDEX IF EXISTS "BlogPost_slug_idx";
DROP INDEX IF EXISTS "BlogCategory_slug_idx";
DROP INDEX IF EXISTS "BlogTag_slug_idx";
DROP INDEX IF EXISTS "Campaign_slug_idx";
DROP INDEX IF EXISTS "Coupon_code_idx";
DROP INDEX IF EXISTS "SiteSetting_key_idx";
