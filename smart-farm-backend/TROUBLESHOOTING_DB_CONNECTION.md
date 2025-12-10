# 🔧 Database Connection Troubleshooting Guide

## Error: Connection terminated due to connection timeout

This error occurs when the backend cannot connect to the PostgreSQL database within the timeout period (60 seconds).

---

## ✅ Quick Fix Checklist

### 1. **Check if Database Server is Running**

#### For Local PostgreSQL:
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# If not running, start it:
Start-Service -Name postgresql-x64-XX  # Replace XX with your version
```

#### For Neon PostgreSQL (Cloud):
- Go to [Neon Console](https://console.neon.tech)
- Check if your database is **Active** (not paused)
- Neon databases auto-pause after inactivity - click "Resume" if needed

#### For Docker PostgreSQL:
```powershell
# Check if container is running
docker ps

# If not running, start it:
docker-compose up -d db
```

---

### 2. **Verify Environment Variables**

Create or check your `.env` file in `smart-farm-backend/` directory:

#### Option A: Using DATABASE_URL (Recommended)
```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

**Example for Neon:**
```env
DATABASE_URL=postgresql://neondb_owner:Abc123Xyz@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Example for Local PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/smartfarm_db
```

#### Option B: Using Individual Variables
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=smartfarm_db
```

**For Neon:**
```env
DB_HOST=ep-xxxxx-xxxxx.region.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASS=your_password
DB_NAME=neondb
```

---

### 3. **Test Connection String Format**

Run the connection checker:
```powershell
cd smart-farm-backend
node check-db-connection.js
```

This will validate your `DATABASE_URL` format and show any issues.

---

### 4. **Verify Network/Firewall**

#### For Remote Databases (Neon, Railway, etc.):
- Check if your IP is whitelisted (if required)
- Verify firewall isn't blocking port 5432
- Try connecting from another tool (pgAdmin, DBeaver, etc.)

#### For Local PostgreSQL:
- Ensure PostgreSQL is listening on `localhost:5432`
- Check `postgresql.conf` for `listen_addresses = 'localhost'`
- Verify `pg_hba.conf` allows local connections

---

### 5. **Check Database Credentials**

#### Test with psql (if installed):
```powershell
# For local PostgreSQL
psql -h localhost -U postgres -d smartfarm_db

# For Neon (replace with your connection string)
psql "postgresql://user:pass@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require"
```

If connection fails here, the issue is with credentials or network, not the application.

---

### 6. **Increase Timeout (Already Done)**

The connection timeout has been increased to **60 seconds** in `typeorm.config.ts`. If you need more time:

1. Edit `smart-farm-backend/src/config/typeorm.config.ts`
2. Find `connectionTimeoutMillis: 60000`
3. Increase to `120000` (2 minutes) if needed

---

### 7. **Check Database Logs**

#### For Local PostgreSQL:
Check PostgreSQL logs (location varies by OS):
- **Windows**: `C:\Program Files\PostgreSQL\XX\data\log\`
- **Linux/Mac**: `/var/log/postgresql/` or check with `sudo journalctl -u postgresql`

Look for connection errors or authentication failures.

#### For Neon:
- Go to Neon Console → Your Project → Logs
- Check for connection attempts and errors

---

### 8. **Common Issues & Solutions**

#### Issue: "Connection refused"
**Solution**: Database server is not running or not listening on the specified port.

#### Issue: "Authentication failed"
**Solution**: Wrong username/password. Double-check credentials in `.env`.

#### Issue: "Database does not exist"
**Solution**: Create the database or use the correct database name.

#### Issue: "SSL required"
**Solution**: Add `?sslmode=require` to your `DATABASE_URL` or set `ssl: { rejectUnauthorized: false }` in config.

#### Issue: "Connection timeout" (this error)
**Solution**: 
1. Database server is unreachable (firewall, network)
2. Database server is paused (Neon)
3. Wrong host/port in connection string
4. Database server is overloaded

---

## 🔍 Debug Steps

### Step 1: Enable Debug Logging
Add to your `.env`:
```env
LOG_LEVEL=debug
```

This will show detailed connection attempts in the console.

### Step 2: Test Connection Manually
```powershell
# Install pg client if needed
npm install -g pg

# Test connection
node -e "const { Client } = require('pg'); const client = new Client({ connectionString: process.env.DATABASE_URL }); client.connect().then(() => { console.log('✅ Connected!'); client.end(); }).catch(err => { console.error('❌ Error:', err.message); });"
```

### Step 3: Check TypeORM Configuration
Verify the config is loading correctly:
```typescript
// Add temporary console.log in typeorm.config.ts
console.log('DB_HOST:', configService.get('DB_HOST'));
console.log('DATABASE_URL:', configService.get('DATABASE_URL') ? 'SET' : 'NOT SET');
```

---

## 📞 Still Having Issues?

1. **Check the exact error message** - it often contains the host/port that failed
2. **Verify your `.env` file** is in `smart-farm-backend/` (not root)
3. **Restart the backend** after changing `.env`
4. **Check if other services** can connect to the same database
5. **Review Neon/Railway dashboard** for database status

---

## ✅ Success Indicators

When connection succeeds, you'll see:
```
[Nest] XXXX  - 12/05/2025, 7:13:38 AM     LOG [TypeOrmModule] Successfully connected to database
```

If you see this, the connection is working! 🎉



