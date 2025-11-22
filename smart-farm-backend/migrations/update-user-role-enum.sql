-- Migration: Update user_role_enum from 'viewer' to 'moderator'
-- Date: 2025-11-14
-- Description: Updates the user role enum to replace 'viewer' with 'moderator'

-- Step 1: Add 'moderator' to the enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'moderator' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
    ) THEN
        ALTER TYPE user_role_enum ADD VALUE 'moderator';
    END IF;
END $$;

-- Step 2: Update any existing users with 'viewer' role to 'moderator'
UPDATE users 
SET role = 'moderator'::user_role_enum 
WHERE role = 'viewer'::user_role_enum;

-- Step 3: Remove 'viewer' from the enum (PostgreSQL doesn't support direct removal)
-- We need to recreate the enum without 'viewer'
-- Note: This is a complex operation that requires:
-- 1. Creating a new enum
-- 2. Altering the column to use the new enum
-- 3. Dropping the old enum
-- 
-- For safety, we'll keep 'viewer' in the enum but ensure all data uses 'moderator'
-- If you want to completely remove 'viewer', you'll need to:
-- 
-- ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);
-- UPDATE users SET role = 'moderator' WHERE role = 'viewer';
-- DROP TYPE user_role_enum;
-- CREATE TYPE user_role_enum AS ENUM ('admin', 'farmer', 'moderator');
-- ALTER TABLE users ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum;

-- For now, the above steps ensure 'moderator' exists and all data is migrated
-- The enum will have both 'viewer' and 'moderator' but only 'moderator' will be used

COMMENT ON TYPE user_role_enum IS 'User roles: admin, farmer, moderator (viewer is deprecated)';











