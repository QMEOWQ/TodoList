package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func init() {
	// load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}
}

// DBConfig 数据库设置
type DBConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// DefaultDBConfig 默认数据库设置
func DefaultDBConfig() DBConfig {
	return DBConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnvAsInt("DB_PORT", 5432),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "postgres"),
		DBName:   getEnv("DB_NAME", "tododb"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}
}

// ConnectionString 构建数据库连接字符串
func (c DBConfig) ConnectionString() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		c.User, c.Password, c.Host, c.Port, c.DBName, c.SSLMode)
}

// ConnectDB 连接到数据库
func ConnectDB() (*sql.DB, error) {
	config := DefaultDBConfig()
	connStr := config.ConnectionString()

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("database connection failed: %w", err)
	}

	log.Println("Connected to the database!")
	return db, nil
}

// InitSchema 初始化数据库架构
func InitSchema(db *sql.DB) error {
	// create table if not exists
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			password VARCHAR(100) NOT NULL,
			email VARCHAR(100) NOT NULL,
			is_admin BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP NOT NULL
		);

		CREATE TABLE IF NOT EXISTS todos (
			id SERIAL PRIMARY KEY,
			task TEXT NOT NULL,
			description TEXT,
			done BOOLEAN DEFAULT FALSE,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		-- 添加新字段（如果不存在）
		ALTER TABLE todos
		ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium';

		ALTER TABLE todos
		ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'personal';

		ALTER TABLE todos
		ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

		ALTER TABLE todos
		ADD COLUMN IF NOT EXISTS reminder BOOLEAN DEFAULT FALSE;

		ALTER TABLE todos
		ADD COLUMN IF NOT EXISTS estimated_time INTEGER;

		ALTER TABLE todos
		ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

		ALTER TABLE todos
		ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

		CREATE TABLE IF NOT EXISTS steps (
			id SERIAL PRIMARY KEY,
			todo_id INTEGER REFERENCES todos (id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			completed BOOLEAN DEFAULT FALSE
		);

		-- 创建索引以提高查询性能
		CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
		CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
		CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
		CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
		CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(done);
		CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
		CREATE INDEX IF NOT EXISTS idx_todos_tags ON todos USING GIN(tags);
		CREATE INDEX IF NOT EXISTS idx_steps_todo_id ON steps(todo_id);
	`)

	if err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	return nil
}

// 获取环境变量
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// 获取整数类型的环境变量
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}

	return defaultValue
}
