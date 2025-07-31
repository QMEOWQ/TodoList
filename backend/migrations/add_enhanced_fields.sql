-- 添加新字段到现有的todos表
-- 这个脚本用于将现有的数据库升级到支持增强功能

-- 添加优先级字段 (支持中文显示的映射: low=普通/绿色, medium=重要/黄色, high=紧急/红色)
ALTER TABLE todos
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'low'
CHECK (priority IN ('low', 'medium', 'high'));

-- 添加分类字段
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'personal';

-- 添加截止日期字段
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

-- 添加提醒字段
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS reminder BOOLEAN DEFAULT FALSE;

-- 添加预估时间字段（分钟）
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS estimated_time INTEGER;

-- 添加标签字段（JSON格式）
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 添加完成时间字段
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 创建性能优化索引
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_tags ON todos USING GIN(tags);

-- 更新现有数据的默认值
UPDATE todos SET 
    priority = 'medium',
    category = 'personal',
    reminder = FALSE,
    tags = '[]'::jsonb
WHERE priority IS NULL OR category IS NULL OR reminder IS NULL OR tags IS NULL;

-- 为已完成的任务设置completed_at时间
UPDATE todos SET 
    completed_at = updated_at
WHERE done = TRUE AND completed_at IS NULL;

COMMIT;
