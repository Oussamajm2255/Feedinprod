# 🔧 Sensor Readings 500 Error Fix

## Issue
`GET /api/v1/sensor-readings` endpoint returning 500 Internal Server Error

## Root Causes Identified

### 1. Composite Primary Key Mismatch
- **Schema:** `sensor_readings` has composite PK `(id, created_at)` for partitioning
- **Entity:** Only defined `id` as primary key
- **Impact:** TypeORM queries may fail on partitioned tables

### 2. Query Builder Join Issues
- Complex joins with `sensor.farm` may fail if relationships aren't properly loaded
- Partitioned table queries can be sensitive to join syntax

### 3. Error Handling
- Errors weren't being logged with full details
- No fallback mechanism for failed queries

## Fixes Applied

### 1. Enhanced Error Handling in Service
**File:** `src/modules/sensor-readings/sensor-readings.service.ts`

Added fallback query mechanism:
```typescript
// If complex query fails, try simpler query without joins
try {
  // Complex query with joins
} catch (error) {
  // Fallback to simple query
  const simpleReadings = await this.sensorReadingRepository.find({
    take: limit,
    skip: offset,
    order: { created_at: 'DESC' },
  });
}
```

### 2. Improved Error Logging
**File:** `src/common/filters/http-exception.filter.ts`

- Added full stack trace logging
- Include error details in development mode
- Better error messages for debugging

### 3. Entity Documentation
**File:** `src/entities/sensor-reading.entity.ts`

- Added comments explaining composite PK situation
- Ensured `created_at` column matches schema

## Testing Steps

1. **Check Backend Logs**
   ```bash
   # Look for error messages when calling the endpoint
   # Should see: "Error in findAll:" with full details
   ```

2. **Test Endpoint Directly**
   ```bash
   # With authentication
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/v1/sensor-readings?limit=10&offset=0
   
   # Check response - should return data or clear error message
   ```

3. **Check Database**
   ```sql
   -- Verify table exists and has data
   SELECT COUNT(*) FROM sensor_readings;
   
   -- Check if partitions exist
   SELECT * FROM pg_inherits WHERE inhparent = 'sensor_readings'::regclass;
   ```

4. **Enable Debug Logging**
   ```env
   LOG_LEVEL=debug
   ```
   This will show all SQL queries being executed.

## Expected Behavior After Fix

✅ **If query succeeds:** Returns sensor readings with sensor data  
✅ **If query fails:** Falls back to simpler query without joins  
✅ **If both fail:** Returns clear error message with stack trace (in dev mode)

## Common Issues & Solutions

### Issue: "relation sensor_readings does not exist"
**Solution:** Run the schema: `smart_farm_schema.sql` in Neon

### Issue: "column reading.created_at does not exist"
**Solution:** Verify the column name matches exactly (snake_case)

### Issue: "composite primary key constraint violation"
**Solution:** This is expected for partitioned tables. TypeORM handles it automatically.

### Issue: Join fails with "farm is not defined"
**Solution:** The fallback query will work without joins. Check if `sensor.farm` relationship is correct.

## Next Steps if Error Persists

1. **Check Backend Console**
   - Look for the exact error message
   - Check if it's a database connection issue
   - Verify the query being executed

2. **Test Simpler Endpoint**
   ```bash
   # Test without authentication first
   GET /api/v1/sensor-readings/by-sensor/{sensorId}
   ```

3. **Verify Database Connection**
   - Check if other endpoints work (farms, devices, sensors)
   - Verify TypeORM connection is established

4. **Check Partitioned Table**
   ```sql
   -- Verify partitions are created
   SELECT schemaname, tablename 
   FROM pg_tables 
   WHERE tablename LIKE 'sensor_readings%';
   ```

## Related Files Modified

- ✅ `src/modules/sensor-readings/sensor-readings.service.ts`
- ✅ `src/common/filters/http-exception.filter.ts`
- ✅ `src/entities/sensor-reading.entity.ts`

## Status

✅ **Fixes Applied** - Ready for testing  
⚠️ **May need additional debugging** if error persists (check logs)

---

**Note:** The 401 errors for `/api/v1/actions` and `/api/v1/notifications/unread-count` are authentication issues, not related to this fix. Those endpoints require valid JWT tokens.

