-- 添加邮箱验证码系统相关字段和表
-- 这个脚本用于支持用户注册时的邮箱验证功能

-- 为用户表添加邮箱验证相关字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP;

-- 创建验证码表用于存储邮箱验证码
CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'registration', -- registration, password_reset
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- 创建清理过期验证码的函数
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM verification_codes 
    WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 创建测试用户（如果不存在）
DO $$
BEGIN
    -- 检查test用户是否已存在
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'test') THEN
        INSERT INTO users (username, password, email, is_admin, created_at, email_verified) 
        VALUES (
            'test', 
            '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 密码: password
            'test@example.com', 
            FALSE, 
            NOW(),
            TRUE
        );
        RAISE NOTICE 'Test user created successfully';
    ELSE
        RAISE NOTICE 'Test user already exists';
    END IF;
END $$;

-- 更新现有用户的邮箱验证状态（假设现有用户都已验证）
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;

COMMIT;
