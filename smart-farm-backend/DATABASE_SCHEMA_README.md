# Smart Farm IoT - Ultimate Production Database Schema

## Overview

This is a production-ready PostgreSQL schema designed for long-term stability and performance. It is 100% compatible with the TypeORM backend entities and includes comprehensive optimizations, audit trails, and maintenance functions.

**Version:** 3.0  
**Database:** PostgreSQL 17+ (Optimized)  
**Compatibility:** 100% backend entity match

---

## Schema Features

### ✅ Core Features

- **100% Backend Compatible**: Matches all TypeORM entities exactly
- **Partitioned Tables**: `sensor_readings` partitioned by month for optimal performance
- **Comprehensive Audit Trail**: All data changes logged automatically
- **Production Indexes**: 50+ optimized indexes including partial and GIN indexes
- **Materialized Views**: Pre-aggregated analytics for fast queries
- **Utility Functions**: Maintenance, cleanup, and health scoring functions
- **Data Integrity**: Extensive CHECK constraints and foreign keys
- **Zero Sample Data**: Clean schema ready for production

### 📊 Tables

1. **users** - User accounts and authentication
2. **farms** - Farm information and ownership
3. **crops** - Crop lifecycle tracking
4. **devices** - IoT device information
5. **sensors** - Sensor configuration and thresholds
6. **sensor_readings** - Time-series sensor data (partitioned)
7. **sensor_actuator_rules** - Automated action rules
8. **action_logs** - Complete action audit trail
9. **notifications** - User notifications
10. **migrations** - Migration tracking
11. **audit_logs** - Comprehensive audit trail

---

## Installation

### 1. Run the Schema

```bash
psql -U postgres -d your_database -f smart_farm_schema.sql
```

### 2. Set Up Partition Management

```bash
psql -U postgres -d your_database -f partition-management.sql
```

### 3. Create Initial Partitions

```sql
-- Create partitions for next 3 months
SELECT create_future_partitions(3);
```

---

## Maintenance Tasks

### Daily Tasks

#### Refresh Materialized Views

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sensor_stats;
```

**Recommended:** Run daily at 1:00 AM via cron or scheduled job.

### Monthly Tasks

#### Create Next Month's Partition

```sql
SELECT create_next_month_partition();
```

**Recommended:** Run on the 25th of each month to create next month's partition.

#### Create Multiple Future Partitions

```sql
-- Create partitions for next 6 months
SELECT create_future_partitions(6);
```

### Quarterly Tasks

#### Cleanup Old Data

```sql
-- Cleanup sensor readings older than 90 days
SELECT cleanup_old_sensor_readings(90);

-- Cleanup read notifications older than 30 days
SELECT cleanup_old_notifications(30);
```

#### Drop Old Partitions

```sql
-- Drop partitions older than 12 months
SELECT drop_old_partitions(12);
```

**Recommended:** Keep at least 12 months of data for historical analysis.

---

## Performance Optimization

### Indexes

The schema includes 50+ optimized indexes:

- **Standard Indexes**: On foreign keys, status fields, timestamps
- **Partial Indexes**: Only index active/enabled records (saves space)
- **GIN Indexes**: For text search (farms.name, devices.name)
- **Composite Indexes**: Multi-column indexes for common query patterns
- **JSONB Indexes**: For notification context searches

### Partitioning

The `sensor_readings` table is partitioned by month:

- **Benefits**: Faster queries, easier maintenance, automatic data archiving
- **Strategy**: Monthly partitions (can be changed to weekly for high-volume)
- **Management**: Use provided partition management functions

### Materialized Views

`mv_daily_sensor_stats` provides pre-aggregated daily statistics:

- **Refresh**: Daily (CONCURRENTLY to avoid locking)
- **Retention**: 90 days of aggregated data
- **Use Case**: Fast analytics and reporting

---

## Utility Functions

### Sensor Analytics

```sql
-- Get average sensor readings for last 24 hours
SELECT * FROM get_sensor_average('sensor-123', 24);

-- Get average for last 7 days
SELECT * FROM get_sensor_average('sensor-123', 168);
```

### Farm Health

```sql
-- Get comprehensive health score for a farm
SELECT * FROM get_farm_health_score('farm-001');
```

Returns:
- `health_score`: Overall health (0-100)
- `online_devices_pct`: Percentage of online devices
- `active_sensors_pct`: Percentage of active sensors
- `recent_violations_count`: Violations in last 24 hours

### Data Cleanup

```sql
-- Cleanup old sensor readings (keeps 90 days)
SELECT cleanup_old_sensor_readings(90);

-- Cleanup old notifications (keeps 30 days)
SELECT cleanup_old_notifications(30);
```

### Partition Management

```sql
-- Create next month's partition
SELECT create_next_month_partition();

-- Create partitions for next 6 months
SELECT create_future_partitions(6);

-- Drop partitions older than 12 months
SELECT drop_old_partitions(12);
```

---

## Views

### Standard Views

1. **v_recent_sensor_readings** - Recent readings with device/farm context
2. **v_active_alerts** - Unread critical/warning notifications
3. **v_farm_statistics** - Comprehensive farm metrics
4. **v_sensor_health** - Sensor health status and violations
5. **v_device_status_summary** - Device status by farm
6. **v_threshold_violations_24h** - Recent threshold violations
7. **v_unread_notifications_summary** - Unread notifications by user

### Materialized Views

1. **mv_daily_sensor_stats** - Pre-aggregated daily sensor statistics

**Usage:**
```sql
-- Query materialized view (fast)
SELECT * FROM mv_daily_sensor_stats 
WHERE reading_date >= CURRENT_DATE - INTERVAL '7 days';

-- Refresh (run daily)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sensor_stats;
```

---

## Security Best Practices

### 1. Database Roles

Create separate roles for different access levels:

```sql
-- Admin role (full access)
CREATE ROLE smartfarm_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smartfarm_admin;

-- API role (read/write, no schema changes)
CREATE ROLE smartfarm_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smartfarm_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smartfarm_api;

-- Read-only role (analytics, reporting)
CREATE ROLE smartfarm_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO smartfarm_readonly;
```

### 2. Connection Pooling

Use connection pooling (PgBouncer or similar) to:
- Limit concurrent connections
- Improve performance
- Reduce resource usage

### 3. Backup Strategy

**Daily Full Backup:**
```bash
pg_dump -U postgres -F c -b -v -f "smartfarm_backup_$(date +%Y%m%d).backup" smartfarm_db
```

**Weekly Sensor Readings Backup:**
```bash
pg_dump -U postgres -t sensor_readings -F c -f "sensor_readings_$(date +%Y%m%d).backup" smartfarm_db
```

**Retention Policy:**
- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

---

## Monitoring Queries

### Database Size

```sql
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'your_database';
```

### Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Usage

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

### Slow Queries (requires pg_stat_statements)

```sql
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Troubleshooting

### Partition Not Found Error

If you get "partition not found" errors, create the partition:

```sql
SELECT create_next_month_partition();
```

### Materialized View Stale

Refresh the materialized view:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sensor_stats;
```

### High Disk Usage

1. Cleanup old data:
```sql
SELECT cleanup_old_sensor_readings(90);
SELECT cleanup_old_notifications(30);
```

2. Drop old partitions:
```sql
SELECT drop_old_partitions(12);
```

3. Vacuum tables:
```sql
VACUUM ANALYZE sensor_readings;
VACUUM ANALYZE notifications;
```

---

## Migration from Existing Schema

If you have an existing schema:

1. **Backup existing data:**
```bash
pg_dump -U postgres -F c -b -v -f backup.bak your_database
```

2. **Review differences** between old and new schema

3. **Create migration script** for data transformation

4. **Test migration** on staging environment

5. **Apply to production** during maintenance window

---

## Support

For issues or questions:
1. Check this README
2. Review schema comments (COMMENT ON statements)
3. Check PostgreSQL logs
4. Review audit_logs table for data change history

---

## Version History

- **v3.0** (2025-01-14): Ultimate production schema with all best practices
- **v2.0**: Enhanced schema with materialized views and utility functions
- **v1.0**: Initial backend-compatible schema

---

## License

This schema is part of the Smart Farm IoT backend system.

