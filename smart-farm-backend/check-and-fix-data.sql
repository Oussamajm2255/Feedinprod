-- ============================================================================
-- Check and Fix Data Ownership Issue
-- ============================================================================
-- This script checks if farms have NULL owner_id and assigns them to users
-- Run this in your Neon SQL Editor
-- ============================================================================

-- Step 1: Check current state
SELECT 
    'Farms with NULL owner_id' as check_type,
    COUNT(*) as count
FROM farms 
WHERE owner_id IS NULL;

SELECT 
    'Total farms' as check_type,
    COUNT(*) as count
FROM farms;

SELECT 
    'Total users' as check_type,
    COUNT(*) as count
FROM users;

-- Step 2: Get a user_id to assign farms to (use the first user)
SELECT 
    user_id,
    email,
    first_name,
    last_name,
    role
FROM users 
ORDER BY created_at ASC 
LIMIT 1;

-- Step 3: Assign all NULL farms to the first user
-- Replace 'YOUR_USER_ID_HERE' with the actual user_id from Step 2
UPDATE farms 
SET owner_id = (
    SELECT user_id FROM users ORDER BY created_at ASC LIMIT 1
)
WHERE owner_id IS NULL;

-- Step 4: Verify the update
SELECT 
    'Farms after update' as check_type,
    COUNT(*) as total_farms,
    COUNT(CASE WHEN owner_id IS NOT NULL THEN 1 END) as farms_with_owner,
    COUNT(CASE WHEN owner_id IS NULL THEN 1 END) as farms_without_owner
FROM farms;

-- Step 5: Show farms with their owners
SELECT 
    f.farm_id,
    f.name,
    f.owner_id,
    u.email as owner_email,
    u.first_name || ' ' || u.last_name as owner_name
FROM farms f
LEFT JOIN users u ON f.owner_id = u.user_id
ORDER BY f.name;











