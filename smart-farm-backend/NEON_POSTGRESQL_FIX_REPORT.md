# 🔍 Root Cause Analysis & Fix Report: Neon PostgreSQL Migration

## Executive Summary

The NestJS + TypeORM backend was completely broken after switching from Railway PostgreSQL to Neon PostgreSQL. **All endpoints returned 500 errors** and **no data was loading** from the database. This report documents the root causes and all fixes applied.

---

## 🚨 Critical Issues Found

### Issue #1: TypeORM Configuration Using MySQL Instead of PostgreSQL
**Severity:** CRITICAL  
**Location:** `src/config/typeorm.config.ts`

**Problem:**
- When `DATABASE_URL` was not set, the config fell back to **MySQL** instead of PostgreSQL
- Neon PostgreSQL requires PostgreSQL, not MySQL
- This caused complete connection failure

**Fix Applied:**
- Changed fallback configuration to use PostgreSQL with individual env vars (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`)
- Added proper SSL configuration for Neon PostgreSQL
- Added error handling when neither `DATABASE_URL` nor individual vars are set

**Code Change:**
```typescript
// BEFORE: Fallback to MySQL
return {
  type: 'mysql',
  host: configService.get('DB_HOST', 'localhost'),
  port: +configService.get<number>('DB_PORT', 3306),
  // ...
};

// AFTER: Fallback to PostgreSQL
if (dbHost && dbUser && dbPass && dbName) {
  return {
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPass,
    database: dbName,
    ssl: { rejectUnauthorized: false },
    // ...
  };
}
```

---

### Issue #2: data-source.ts Hardcoded to MySQL
**Severity:** CRITICAL  
**Location:** `data-source.ts`

**Problem:**
- The TypeORM DataSource was hardcoded to `type: 'mysql'`
- This file is used for migrations and CLI operations
- Would fail when trying to connect to Neon PostgreSQL

**Fix Applied:**
- Changed to `type: 'postgres'`
- Added PostgreSQL port (5432) and SSL configuration
- Updated to match Neon PostgreSQL requirements

**Code Change:**
```typescript
// BEFORE
export const AppDataSource = new DataSource({
  type: 'mysql',
  // ...
});

// AFTER
export const AppDataSource = new DataSource({
  type: 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: { rejectUnauthorized: false },
  // ...
});
```

---

### Issue #3: Missing Timestamp Columns in Entities
**Severity:** HIGH  
**Locations:** 
- `src/modules/farms/farm.entity.ts`
- `src/entities/device.entity.ts`
- `src/entities/sensor.entity.ts`

**Problem:**
- Database schema includes `created_at` and `updated_at` columns
- Entities were missing these columns
- TypeORM queries would fail when trying to access these columns
- Some services referenced these columns but they didn't exist in entities

**Fix Applied:**
- Added `@CreateDateColumn` and `@UpdateDateColumn` to all entities that need them
- Matched precision (6) to match schema `TIMESTAMP(6)`

**Entities Fixed:**
- ✅ `Farm` - Added `created_at`, `updated_at`
- ✅ `Device` - Added `created_at`, `updated_at`
- ✅ `Sensor` - Added `created_at`, `updated_at`

---

### Issue #4: Column Name Inconsistencies
**Severity:** HIGH  
**Location:** `src/entities/sensor-reading.entity.ts` and multiple services

**Problem:**
- Entity used `createdAt` (camelCase) but schema uses `created_at` (snake_case)
- Services mixed usage of `createdAt` and `created_at`
- TypeORM couldn't map columns correctly
- Queries failed with "column does not exist" errors

**Fix Applied:**
- Changed entity property to `created_at` to match database schema
- Updated all service references to use `created_at` consistently
- Fixed in:
  - `sensor-readings.service.ts`
  - `sensor-data.service.ts`
  - `health.service.ts`

**Files Updated:**
- ✅ `src/entities/sensor-reading.entity.ts` - Changed `createdAt` → `created_at`
- ✅ `src/modules/sensor-readings/sensor-readings.service.ts` - 5 fixes
- ✅ `src/modules/mqtt/sensor-data.service.ts` - 6 fixes
- ✅ `src/modules/health/health.service.ts` - 1 fix

---

## ✅ Checklist Completion

### 1. ✅ .env Loading
- **Status:** CONFIRMED
- ConfigModule loads env vars correctly
- Supports both `DATABASE_URL` and individual vars (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`)
- No old Railway URL detected in code

### 2. ✅ TypeORM Configuration
- **Status:** FIXED
- `TypeOrmModule.forRoot` now uses PostgreSQL (not MySQL)
- `ssl: { rejectUnauthorized: false }` present for Neon
- `synchronize=false`, `migrationsRun=false` (production-safe)
- `autoLoadEntities=true` ✓
- Entities path correct ✓
- No conflicting configs ✓
- `data-source.ts` fixed to use PostgreSQL ✓

### 3. ✅ Entities
- **Status:** FIXED
- All entities match database schema
- Naming, casing, and types verified
- Primary keys match SQL schema
- `farm_id`, `device_id`, `sensor_id` exist everywhere
- Relations use correct types (varchar vs uuid vs number)

### 4. ✅ Modules
- **Status:** VERIFIED
- All imports correct
- Each module registers `TypeOrmModule.forFeature([...entities])`
- No circular dependencies detected

### 5. ✅ Services
- **Status:** FIXED
- No hardcoded queries with wrong table names
- All column references match schema
- Fixed `createdAt` → `created_at` inconsistencies

### 6. ⚠️ Errors
- **Status:** NEEDS TESTING
- Stack traces should now show proper errors (if any remain)
- First failing service should be identified after restart
- DB connection should succeed with new config

### 7. ⚠️ Database Behavior
- **Status:** NEEDS VERIFICATION
- Backend queries now match table structure
- App should point to correct Neon database (not default postgres)

### 8. ✅ Fixes Applied
- **Status:** COMPLETE
- Code-level fixes: ✅
- Config-level fixes: ✅
- Env fixes: Documented below
- TypeORM config rewritten: ✅
- Imports verified: ✅

---

## 📋 Environment Variables Required

### Option 1: Using DATABASE_URL (Recommended for Neon)
```env
DATABASE_URL=postgresql://username:password@ep-xxxxx-xxxxx.region.aws.neon.tech/database_name?sslmode=require
```

### Option 2: Using Individual Variables
```env
DB_HOST=ep-xxxxx-xxxxx.region.aws.neon.tech
DB_PORT=5432
DB_USER=your_username
DB_PASS=your_password
DB_NAME=your_database_name
```

**Important:** 
- Both options now use PostgreSQL (not MySQL)
- SSL is automatically enabled for Neon
- Port defaults to 5432 if not specified

---

## 🔧 Files Modified

### Configuration Files
1. ✅ `src/config/typeorm.config.ts` - Fixed PostgreSQL fallback
2. ✅ `data-source.ts` - Changed from MySQL to PostgreSQL

### Entity Files
3. ✅ `src/modules/farms/farm.entity.ts` - Added timestamps
4. ✅ `src/entities/device.entity.ts` - Added timestamps
5. ✅ `src/entities/sensor.entity.ts` - Added timestamps
6. ✅ `src/entities/sensor-reading.entity.ts` - Fixed column name

### Service Files
7. ✅ `src/modules/sensor-readings/sensor-readings.service.ts` - Fixed column references
8. ✅ `src/modules/mqtt/sensor-data.service.ts` - Fixed column references
9. ✅ `src/modules/health/health.service.ts` - Fixed column references

---

## 🧪 Testing Steps

1. **Set Environment Variables**
   ```bash
   # Option 1: DATABASE_URL
   export DATABASE_URL="postgresql://..."
   
   # Option 2: Individual vars
   export DB_HOST="ep-xxxxx.region.aws.neon.tech"
   export DB_USER="your_user"
   export DB_PASS="your_pass"
   export DB_NAME="your_db"
   ```

2. **Start Backend**
   ```bash
   cd smart-farm-backend
   npm run start:dev
   ```

3. **Verify Connection**
   - Look for: `✅ [TypeOrmModule] Successfully connected to database`
   - Should NOT see: `❌ Error: getaddrinfo ENOTFOUND` or MySQL errors

4. **Test Endpoints**
   ```bash
   # Test farms
   curl http://localhost:3000/api/v1/farms
   
   # Test devices
   curl http://localhost:3000/api/v1/devices
   
   # Test sensors
   curl http://localhost:3000/api/v1/sensors
   ```

5. **Check Database**
   ```sql
   -- In Neon SQL Editor or psql
   SELECT COUNT(*) FROM farms;
   SELECT COUNT(*) FROM devices;
   SELECT COUNT(*) FROM sensors;
   ```

---

## 🎯 Expected Results After Fix

✅ **Backend starts successfully**  
✅ **Database connection established**  
✅ **No 500 errors on endpoints**  
✅ **Farms, devices, sensors load correctly**  
✅ **Data appears in responses**  
✅ **TypeORM queries execute successfully**

---

## 🚨 If Issues Persist

### Check 1: Environment Variables
```bash
# Verify env vars are loaded
node -e "require('dotenv').config(); console.log(process.env.DB_HOST)"
```

### Check 2: Database Connection
```bash
# Test connection directly
psql "postgresql://user:pass@host/db?sslmode=require"
```

### Check 3: Schema Match
- Verify `smart_farm_schema.sql` has been run in Neon
- Check tables exist: `\dt` in psql
- Verify column names match: `\d farms` in psql

### Check 4: TypeORM Logging
Enable debug logging in `.env`:
```env
LOG_LEVEL=debug
```

This will show all SQL queries and help identify remaining issues.

---

## 📝 Summary

**Root Cause:** TypeORM was configured to use MySQL when `DATABASE_URL` was not set, but Neon requires PostgreSQL. Additionally, entity-schema mismatches (missing columns, wrong column names) caused query failures.

**Solution:** 
1. Fixed TypeORM config to use PostgreSQL for both `DATABASE_URL` and individual env vars
2. Fixed `data-source.ts` to use PostgreSQL
3. Added missing timestamp columns to entities
4. Fixed column name inconsistencies (`createdAt` → `created_at`)

**Status:** ✅ All critical fixes applied. Ready for testing.

---

## 🔗 Related Files

- `NEON_SETUP_GUIDE.md` - Neon setup instructions
- `smart_farm_schema.sql` - Database schema
- `DATABASE_SCHEMA_README.md` - Schema documentation

---

**Report Generated:** 2025-01-XX  
**Fixed By:** AI Assistant  
**Status:** ✅ Complete - Ready for Testing

