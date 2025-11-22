# 🔍 Why You See No Data (Except Crops)

## The Problem

**All farms, devices, and sensors are filtered by `owner_id` when you're authenticated.**

### What's Happening:

1. ✅ **Crops work** - They don't filter by owner
2. ❌ **Farms return empty** - Query: `WHERE owner_id = 'your-user-id'`
3. ❌ **Devices return empty** - Query: `WHERE farm.owner_id = 'your-user-id'`
4. ❌ **Sensors return empty** - Query: `WHERE farm.owner_id = 'your-user-id'`

### Root Cause:

The sample data (`sample-data.sql`) has farms with `owner_id = NULL`:
```sql
INSERT INTO farms (..., owner_id, ...) VALUES
('farm-green-valley-001', ..., NULL, ...);
```

When you're logged in, the backend filters by your `user_id`, but since all farms have `NULL` owner_id, nothing matches!

## ✅ Solution

### Option 1: Assign Farms to Your User (Recommended)

Run this SQL in Neon SQL Editor:

```sql
-- Get your user_id first
SELECT user_id, email FROM users WHERE email = 'your-email@example.com';

-- Then assign all NULL farms to your user (replace YOUR_USER_ID)
UPDATE farms 
SET owner_id = 'YOUR_USER_ID_HERE'
WHERE owner_id IS NULL;
```

### Option 2: Use the Check Script

1. Open `check-and-fix-data.sql` in Neon SQL Editor
2. Run it - it will:
   - Show you the current state
   - Assign all NULL farms to the first user
   - Verify the update

### Option 3: Check Backend Logs

After restarting the backend, check the console logs. You should see:
```
⚠️ No farms found for owner abc123, but there are 4 total farms in database
```

This confirms the issue - data exists but isn't assigned to your user.

## 🧪 Testing

After fixing:

1. **Restart backend** (if needed)
2. **Refresh frontend**
3. **Check console logs** - Should see:
   ```
   ✅ Found 4 farms for owner your-user-id
   ✅ Found X devices for owner your-user-id
   ✅ Found X sensors for owner your-user-id
   ```

## 📝 Quick Fix SQL

```sql
-- Quick one-liner: Assign all farms to first user
UPDATE farms 
SET owner_id = (SELECT user_id FROM users ORDER BY created_at ASC LIMIT 1)
WHERE owner_id IS NULL;
```

## 🔍 Verify Data Exists

Check if data exists in database:

```sql
-- Check farms
SELECT COUNT(*) FROM farms;
SELECT farm_id, name, owner_id FROM farms;

-- Check devices  
SELECT COUNT(*) FROM devices;
SELECT device_id, name, farm_id FROM devices LIMIT 5;

-- Check sensors
SELECT COUNT(*) FROM sensors;
SELECT sensor_id, type, farm_id FROM sensors LIMIT 5;
```

If these return data but the API doesn't, it's definitely the owner_id filter issue!

---

**Next Step:** Run the SQL fix above, then restart your backend and test again! 🚀











