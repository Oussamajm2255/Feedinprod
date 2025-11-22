-- ============================================================================
-- Partition Management Script for sensor_readings Table
-- ============================================================================
-- Purpose: Create monthly partitions for sensor_readings table
-- Usage: Run monthly (via cron or scheduled job) to create next month's partition
-- ============================================================================

-- Function to create partition for next month
CREATE OR REPLACE FUNCTION create_next_month_partition()
RETURNS TEXT AS $$
DECLARE
    next_month DATE;
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    -- Calculate next month
    next_month := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
    
    -- Generate partition name (e.g., sensor_readings_2025_02)
    partition_name := 'sensor_readings_' || TO_CHAR(next_month, 'YYYY_MM');
    
    -- Calculate date range
    start_date := DATE_TRUNC('month', next_month);
    end_date := start_date + INTERVAL '1 month';
    
    -- Create partition if it doesn't exist
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF sensor_readings
        FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date);
    
    RETURN 'Partition created: ' || partition_name || ' (' || start_date || ' to ' || end_date || ')';
END;
$$ LANGUAGE plpgsql;

-- Function to create partitions for next N months
CREATE OR REPLACE FUNCTION create_future_partitions(months_ahead INTEGER DEFAULT 3)
RETURNS TEXT[] AS $$
DECLARE
    result TEXT[];
    i INTEGER;
    month_date DATE;
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    FOR i IN 1..months_ahead LOOP
        month_date := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
        partition_name := 'sensor_readings_' || TO_CHAR(month_date, 'YYYY_MM');
        start_date := DATE_TRUNC('month', month_date);
        end_date := start_date + INTERVAL '1 month';
        
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I PARTITION OF sensor_readings
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date);
        
        result := array_append(result, partition_name);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to drop old partitions (older than N months)
CREATE OR REPLACE FUNCTION drop_old_partitions(keep_months INTEGER DEFAULT 12)
RETURNS TEXT[] AS $$
DECLARE
    result TEXT[];
    partition_record RECORD;
    cutoff_date DATE;
BEGIN
    cutoff_date := DATE_TRUNC('month', CURRENT_DATE) - (keep_months || ' months')::INTERVAL;
    
    FOR partition_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename LIKE 'sensor_readings_%'
          AND tablename ~ '^sensor_readings_\d{4}_\d{2}$'
    LOOP
        -- Extract year and month from partition name
        DECLARE
            partition_year INTEGER;
            partition_month INTEGER;
            partition_start DATE;
        BEGIN
            partition_year := (regexp_match(partition_record.tablename, '(\d{4})_(\d{2})'))[1]::INTEGER;
            partition_month := (regexp_match(partition_record.tablename, '(\d{4})_(\d{2})'))[2]::INTEGER;
            partition_start := DATE(partition_year || '-' || LPAD(partition_month::TEXT, 2, '0') || '-01');
            
            IF partition_start < cutoff_date THEN
                EXECUTE format('DROP TABLE IF EXISTS %I', partition_record.tablename);
                result := array_append(result, partition_record.tablename);
            END IF;
        END;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Example: Create partitions for next 3 months
-- SELECT create_future_partitions(3);

-- Example: Create next month's partition
-- SELECT create_next_month_partition();

-- Example: Drop partitions older than 12 months
-- SELECT drop_old_partitions(12);

