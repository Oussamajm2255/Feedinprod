# 📋 Assign Farms to Farmers - Instructions

## Quick Steps

1. **Open Neon SQL Editor** (or your PostgreSQL client)

2. **Copy and paste** the entire contents of `assign-farms-to-farmers.sql`

3. **Run the script** - It will:
   - Verify the farmers exist
   - Show current farm ownership
   - Assign farms to farmers
   - Verify the assignments
   - Show a summary

## What It Does

### Farmer 1: chahine Suissi
- **Email:** legoochahine@gmail.com
- **User ID:** `3bc1df04-b660-4318-ae67-e0408189d354`
- **Gets:**
  - Green Valley Organic Farm
  - Sunset Orchards

### Farmer 2: farmer test
- **Email:** chahinesuissi10@gmail.com
- **User ID:** `94515776-8715-45f5-808f-e3e7adad142a`
- **Gets:**
  - Highland Greenhouse Complex
  - Coastal Hydroponics

## After Running

✅ **Both farmers will see their farms** when logged in  
✅ **Devices and sensors** linked to those farms will appear  
✅ **All data will be accessible** through the API

## Verify It Worked

After running the script, test in your frontend:

1. **Login as chahine Suissi** (legoochahine@gmail.com)
   - Should see 2 farms
   - Should see devices/sensors from those farms

2. **Login as farmer test** (chahinesuissi10@gmail.com)
   - Should see 2 farms
   - Should see devices/sensors from those farms

## If You Want Different Assignments

Edit the SQL script and change which farms go to which farmer:

```sql
-- Example: Give all farms to farmer 1
UPDATE farms 
SET owner_id = '3bc1df04-b660-4318-ae67-e0408189d354'
WHERE owner_id IS NULL;
```

---

**File:** `assign-farms-to-farmers.sql`  
**Run in:** Neon SQL Editor or psql











