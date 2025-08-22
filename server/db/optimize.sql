-- Database optimization script for HYBE Booking Platform
-- Run this script to create indexes and optimize queries

-- Create indexes for subscription_ids table
CREATE INDEX IF NOT EXISTS idx_subscription_ids_subscription_id 
ON subscription_ids(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_ids_active 
ON subscription_ids(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_subscription_ids_expires_at 
ON subscription_ids(expires_at) WHERE expires_at IS NOT NULL;

-- Composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_subscription_ids_lookup 
ON subscription_ids(subscription_id, is_active, expires_at) 
WHERE is_active = true;

-- Index for subscription type filtering
CREATE INDEX IF NOT EXISTS idx_subscription_ids_type 
ON subscription_ids(subscription_type);

-- Add columns if they don't exist (for enhanced tracking)
DO $$ 
BEGIN
    -- Add last_used_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_ids' 
                   AND column_name = 'last_used_at') THEN
        ALTER TABLE subscription_ids ADD COLUMN last_used_at TIMESTAMP;
    END IF;
    
    -- Add usage_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_ids' 
                   AND column_name = 'usage_count') THEN
        ALTER TABLE subscription_ids ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'subscription_ids' 
                   AND column_name = 'expires_at') THEN
        ALTER TABLE subscription_ids ADD COLUMN expires_at TIMESTAMP;
    END IF;
END $$;

-- Create analytics table for tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_date 
ON analytics_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_ip 
ON analytics_events(ip_address);

-- GIN index for JSONB data queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_data 
ON analytics_events USING GIN (event_data);

-- Create booking requests table for form submissions
CREATE TABLE IF NOT EXISTS booking_requests (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(50) UNIQUE NOT NULL,
    celebrity VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    budget VARCHAR(50) NOT NULL,
    custom_amount DECIMAL(12,2),
    attendees INTEGER,
    preferred_date DATE,
    location TEXT,
    special_requests TEXT,
    subscription_id VARCHAR(20),
    contact_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_organization VARCHAR(100),
    privacy_consent BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for booking requests
CREATE INDEX IF NOT EXISTS idx_booking_requests_booking_id 
ON booking_requests(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_requests_email 
ON booking_requests(contact_email);

CREATE INDEX IF NOT EXISTS idx_booking_requests_status 
ON booking_requests(status);

CREATE INDEX IF NOT EXISTS idx_booking_requests_created_at 
ON booking_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_booking_requests_celebrity 
ON booking_requests(celebrity);

-- Function to update last_used_at and usage_count
CREATE OR REPLACE FUNCTION update_subscription_usage(sub_id VARCHAR(20))
RETURNS VOID AS $$
BEGIN
    UPDATE subscription_ids 
    SET last_used_at = CURRENT_TIMESTAMP,
        usage_count = COALESCE(usage_count, 0) + 1
    WHERE subscription_id = sub_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired analytics data (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_analytics(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_events 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- View for subscription analytics
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
    subscription_type,
    COUNT(*) as total_subscriptions,
    COUNT(CASE WHEN is_active THEN 1 END) as active_subscriptions,
    COUNT(CASE WHEN last_used_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as used_last_30_days,
    AVG(usage_count) as avg_usage_count,
    MAX(last_used_at) as last_usage
FROM subscription_ids
GROUP BY subscription_type;

-- View for booking analytics
CREATE OR REPLACE VIEW booking_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as booking_date,
    celebrity,
    event_type,
    COUNT(*) as booking_count,
    COUNT(CASE WHEN subscription_id IS NOT NULL THEN 1 END) as with_subscription,
    AVG(CASE 
        WHEN custom_amount IS NOT NULL THEN custom_amount 
        WHEN budget LIKE '%-%' THEN 
            CAST(SPLIT_PART(REPLACE(budget, '$', ''), '-', 1) AS DECIMAL) 
        ELSE 0 
    END) as avg_budget
FROM booking_requests
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), celebrity, event_type
ORDER BY booking_date DESC;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_requests_updated_at 
    BEFORE UPDATE ON booking_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON booking_requests TO your_app_user;
-- GRANT SELECT, INSERT ON analytics_events TO your_app_user;
-- GRANT SELECT ON subscription_analytics TO your_app_user;
-- GRANT SELECT ON booking_analytics TO your_app_user;

COMMENT ON TABLE subscription_ids IS 'Stores HYBE subscription information with usage tracking';
COMMENT ON TABLE analytics_events IS 'Stores application analytics and event tracking data';
COMMENT ON TABLE booking_requests IS 'Stores booking form submissions with full details';
COMMENT ON VIEW subscription_analytics IS 'Aggregated subscription usage and status data';
COMMENT ON VIEW booking_analytics IS 'Daily booking trends and patterns';
