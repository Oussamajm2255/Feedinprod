-- ============================================================================
-- Assign Farms to Farmers
-- ============================================================================
-- This script assigns existing farms to the two farmers from data-users.csv
-- Run this in your Neon SQL Editor
-- ============================================================================

-- Step 1: Verify the farmers exist
SELECT 
    user_id,
    email,
    first_name || ' ' || last_name as full_name,
    role
FROM users 
WHERE user_id IN (
    '3bc1df04-b660-4318-ae67-e0408189d354',  -- chahine Suissi
    '94515776-8715-45f5-808f-e3e7adad142a'   -- farmer test
);

-- Step 2: Check current farms and their ownership
SELECT 
    farm_id,
    name,
    owner_id,
    CASE 
        WHEN owner_id IS NULL THEN 'No owner'
        ELSE 'Has owner'
    END as ownership_status
FROM farms
ORDER BY name;

-- Step 3: Assign farms to farmers
-- Farmer 1: chahine Suissi (3bc1df04-b660-4318-ae67-e0408189d354)
-- Gets: Green Valley Organic Farm and Sunset Orchards
UPDATE farms 
SET owner_id = '3bc1df04-b660-4318-ae67-e0408189d354'
WHERE farm_id IN (
    'farm-green-valley-001',
    'farm-sunset-orchards-001'
);

-- Farmer 2: farmer test (94515776-8715-45f5-808f-e3e7adad142a)
-- Gets: Highland Greenhouse Complex and Coastal Hydroponics
UPDATE farms 
SET owner_id = '94515776-8715-45f5-808f-e3e7adad142a'
WHERE farm_id IN (
    'farm-highland-greenhouse-001',
    'farm-coastal-hydroponics-001'
);

-- Step 4: Verify the assignments
SELECT 
    f.farm_id,
    f.name as farm_name,
    f.owner_id,
    u.email as owner_email,
    u.first_name || ' ' || u.last_name as owner_name
FROM farms f
LEFT JOIN users u ON f.owner_id = u.user_id
ORDER BY u.email, f.name;

-- Step 5: Summary
SELECT 
    u.email,
    u.first_name || ' ' || u.last_name as farmer_name,
    COUNT(f.farm_id) as farms_count,
    STRING_AGG(f.name, ', ') as farm_names
FROM users u
LEFT JOIN farms f ON f.owner_id = u.user_id
WHERE u.user_id IN (
    '3bc1df04-b660-4318-ae67-e0408189d354',
    '94515776-8715-45f5-808f-e3e7adad142a'
)
GROUP BY u.user_id, u.email, u.first_name, u.last_name
ORDER BY u.email;

-- ============================================================================
-- Expected Result:
-- ============================================================================
-- chahine Suissi (legoochahine@gmail.com):
--   - Green Valley Organic Farm
--   - Sunset Orchards
--
-- farmer test (chahinesuissi10@gmail.com):
--   - Highland Greenhouse Complex
--   - Coastal Hydroponics
-- ============================================================================











