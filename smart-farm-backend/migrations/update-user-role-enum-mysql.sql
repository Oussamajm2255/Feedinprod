-- Migration: Update user role enum from 'viewer' to 'moderator' (MySQL)
-- Date: 2025-11-14
-- Description: Updates the user role enum column to replace 'viewer' with 'moderator' in MySQL

-- Step 1: Update any existing users with 'viewer' role to 'moderator'
UPDATE users 
SET role = 'moderator' 
WHERE role = 'viewer';

-- Step 2: Modify the column to update the enum definition
-- Note: This will fail if there are still 'viewer' values, so Step 1 is critical
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'farmer', 'moderator') NOT NULL DEFAULT 'farmer';

-- Verify the migration
SELECT DISTINCT role FROM users;











