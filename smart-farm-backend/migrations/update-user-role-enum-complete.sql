-- Migration: Update user_role_enum from 'viewer' to 'moderator'
-- Date: 2025-11-14
-- Description: Completely recreates the user role enum to replace 'viewer' with 'moderator'
-- 
-- IMPORTANT: Run this migration during maintenance window or when no users are being created
-- This migration will:
-- 1. Add 'moderator' to the enum if it doesn't exist
-- 2. Update all existing 'viewer' roles to 'moderator'
-- 3. Recreate the enum without 'viewer' (if needed)

BEGIN;

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

-- Step 3: Recreate enum without 'viewer' (only if 'viewer' exists in enum)
DO $$
DECLARE
    viewer_exists BOOLEAN;
BEGIN
    -- Check if 'viewer' exists in the enum
    SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'viewer' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
    ) INTO viewer_exists;
    
    -- Only recreate if 'viewer' exists
    IF viewer_exists THEN
        -- Temporarily change column to text
        ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);
        
        -- Ensure all values are valid
        UPDATE users SET role = 'moderator' WHERE role = 'viewer';
        UPDATE users SET role = 'admin' WHERE role NOT IN ('admin', 'farmer', 'moderator');
        UPDATE users SET role = 'farmer' WHERE role IS NULL OR role = '';
        
        -- Drop old enum
        DROP TYPE user_role_enum;
        
        -- Create new enum without 'viewer'
        CREATE TYPE user_role_enum AS ENUM ('admin', 'farmer', 'moderator');
        
        -- Change column back to enum
        ALTER TABLE users ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum;
        
        RAISE NOTICE 'Enum recreated successfully - viewer removed, moderator added';
    ELSE
        RAISE NOTICE 'Viewer does not exist in enum, no recreation needed';
    END IF;
END $$;

COMMIT;

-- Verify the migration
DO $$
DECLARE
    enum_values TEXT[];
BEGIN
    SELECT array_agg(enumlabel ORDER BY enumsortorder) 
    INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum');
    
    RAISE NOTICE 'Current enum values: %', array_to_string(enum_values, ', ');
    
    IF 'viewer' = ANY(enum_values) THEN
        RAISE WARNING 'WARNING: viewer still exists in enum!';
    ELSE
        RAISE NOTICE 'SUCCESS: Enum contains only admin, farmer, moderator';
    END IF;
END $$;











