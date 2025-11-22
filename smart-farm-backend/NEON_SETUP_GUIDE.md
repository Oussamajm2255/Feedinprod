# Neon Database Setup Guide

## Quick Fix for Connection Error

If you're getting `Error: getaddrinfo ENOTFOUND base`, your `DATABASE_URL` is malformed.

## Step 1: Get Your Neon Connection String

1. **Go to Neon Console**: https://console.neon.tech
2. **Select your project**
3. **Click on your database** (or create one if you haven't)
4. **Click "Connection Details"** or look for the connection string
5. **Copy the connection string** - it should look like:

```
postgresql://username:password@ep-xxxxx-xxxxx.region.aws.neon.tech/database_name?sslmode=require
```

## Step 2: Set Up Environment Variables

### Option A: Create `.env` file (Recommended for Local Development)

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** and paste your Neon connection string:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxxxx-xxxxx.region.aws.neon.tech/database_name?sslmode=require
   ```

3. **Make sure `.env` is in `.gitignore`** (it should be already)

### Option B: Set Environment Variable Directly (Windows)

```cmd
set DATABASE_URL=postgresql://username:password@ep-xxxxx-xxxxx.region.aws.neon.tech/database_name?sslmode=require
```

### Option C: Set Environment Variable (PowerShell)

```powershell
$env:DATABASE_URL="postgresql://username:password@ep-xxxxx-xxxxx.region.aws.neon.tech/database_name?sslmode=require"
```

## Step 3: Verify Connection String Format

Your connection string MUST include:
- ✅ Protocol: `postgresql://`
- ✅ Username: `your_username`
- ✅ Password: `your_password`
- ✅ Host: `ep-xxxxx-xxxxx.region.aws.neon.tech`
- ✅ Database name: `your_database_name`
- ✅ SSL mode: `?sslmode=require`

**Example of CORRECT format:**
```
postgresql://neondb_owner:Abc123Xyz@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Example of WRONG format (what causes "base" error):**
```
base://username:password@host/database  ❌
postgres://...  ❌ (should be postgresql://)
```

## Step 4: Test the Connection

1. **Stop your backend** (Ctrl+C)
2. **Set the environment variable** (see Step 2)
3. **Start your backend again:**
   ```bash
   npm start
   ```

You should see:
```
✅ [TypeOrmModule] Successfully connected to database
```

Instead of:
```
❌ Error: getaddrinfo ENOTFOUND base
```

## Step 5: Run the Schema

Once connected, run your schema:

1. **Get connection string from Neon** (with password)
2. **Connect using psql or Neon SQL Editor:**
   ```bash
   psql "postgresql://username:password@host/database?sslmode=require"
   ```

3. **Run the schema:**
   ```sql
   \i smart_farm_schema.sql
   ```

   Or copy-paste the entire `smart_farm_schema.sql` file into Neon SQL Editor.

## Common Issues

### Issue 1: "getaddrinfo ENOTFOUND base"
**Cause:** DATABASE_URL is malformed or missing
**Fix:** 
- Check your `.env` file exists
- Verify DATABASE_URL format is correct
- Make sure you're using `postgresql://` not `postgres://` or `base://`

### Issue 2: "Connection refused"
**Cause:** Wrong hostname or port
**Fix:**
- Double-check the hostname from Neon Console
- Make sure you're using the correct port (usually 5432)

### Issue 3: "Password authentication failed"
**Cause:** Wrong password
**Fix:**
- Reset password in Neon Console
- Update DATABASE_URL with new password

### Issue 4: "Database does not exist"
**Cause:** Database name is wrong
**Fix:**
- Check database name in Neon Console
- Create database if it doesn't exist

## Neon-Specific Tips

1. **Use Connection Pooling**: Neon provides pooled connections (usually port 5432)
2. **SSL Required**: Always include `?sslmode=require` in connection string
3. **Branching**: You can create branches for testing (optional)
4. **Monitoring**: Check Neon Dashboard for connection stats

## Quick Test Command

Test your connection string directly:

```bash
# Windows (PowerShell)
$env:DATABASE_URL="your_connection_string"; npm start

# Or create .env file and run
npm start
```

## Next Steps After Connection Works

1. ✅ Database connection successful
2. ✅ Run `smart_farm_schema.sql` in Neon SQL Editor
3. ✅ Run `partition-management.sql` in Neon SQL Editor
4. ✅ Create initial partitions: `SELECT create_future_partitions(6);`
5. ✅ Test your backend endpoints

## Need Help?

- Check Neon documentation: https://neon.tech/docs
- Verify connection string format matches examples above
- Check backend logs for specific error messages

