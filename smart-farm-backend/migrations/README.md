# Database Migrations

## Update User Role Enum (viewer → moderator)

This migration updates the user role enum to replace 'viewer' with 'moderator'.

### For PostgreSQL (Production/Railway)

Run the complete migration:

```bash
psql $DATABASE_URL -f migrations/update-user-role-enum-complete.sql
```

Or if using a local PostgreSQL connection:

```bash
psql -U your_username -d your_database -f migrations/update-user-role-enum-complete.sql
```

### For MySQL (Local Development)

Run the MySQL migration:

```bash
mysql -u your_username -p your_database < migrations/update-user-role-enum-mysql.sql
```

Or connect to MySQL and run:

```sql
SOURCE migrations/update-user-role-enum-mysql.sql;
```

### Alternative: Using TypeORM Synchronize

If `synchronize: true` is enabled in your TypeORM config, TypeORM should automatically update the schema. However, if you have existing data with 'viewer' role, you may need to:

1. First update existing data:
   ```sql
   UPDATE users SET role = 'moderator' WHERE role = 'viewer';
   ```

2. Then let TypeORM synchronize the schema (restart the backend)

### Verification

After running the migration, verify:

```sql
-- PostgreSQL
SELECT unnest(enum_range(NULL::user_role_enum));

-- MySQL
SHOW COLUMNS FROM users LIKE 'role';
```

You should see: `admin`, `farmer`, `moderator` (no `viewer`)

### Troubleshooting

If you still get errors after running the migration:

1. Check the backend console logs - they now include detailed error information
2. Verify your database type (PostgreSQL vs MySQL)
3. Ensure no users have 'viewer' role before modifying the enum
4. If using TypeORM synchronize, try disabling it and running migrations manually











