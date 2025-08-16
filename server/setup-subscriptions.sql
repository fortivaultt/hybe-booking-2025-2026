-- Create subscription_ids table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_ids (
    id SERIAL PRIMARY KEY,
    subscription_id VARCHAR(13) UNIQUE NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    subscription_type VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample valid HYBE subscription IDs
INSERT INTO subscription_ids (subscription_id, user_name, subscription_type, is_active) VALUES
    ('HYBABC1234567', 'Kim Taehyung', 'premium', true),
    ('HYBDEF9876543', 'Park Jimin', 'elite', true),
    ('HYBGHI5555555', 'Jeon Jungkook', 'premium', true),
    ('HYBJKL7777777', 'Kim Namjoon', 'elite', true),
    ('HYBMNO3333333', 'Min Yoongi', 'standard', true),
    ('HYBPQR8888888', 'Jung Hoseok', 'premium', true),
    ('HYBSTU1111111', 'Kim Seokjin', 'elite', true),
    ('HYBVWX2222222', 'Lalisa Manobal', 'premium', true),
    ('HYBYZZ4444444', 'Kim Jennie', 'elite', true),
    ('HYBAAA6666666', 'Park Chaeyoung', 'premium', true),
    ('HYBBBB9999999', 'Kim Jisoo', 'standard', true),
    ('HYBCCC0000000', 'Minji Kim', 'elite', true),
    ('HYBDDD1234321', 'Hanni Pham', 'premium', true),
    ('HYBEEE5678765', 'Danielle Marsh', 'standard', true),
    ('HYBFFF9012345', 'Haerin Kang', 'elite', true)
ON CONFLICT (subscription_id) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_id ON subscription_ids(subscription_id);
CREATE INDEX IF NOT EXISTS idx_active_subscriptions ON subscription_ids(is_active) WHERE is_active = true;
