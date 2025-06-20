package config

import (
	"os"
	"testing"
)

func TestConnectionString(t *testing.T) {
	config := DBConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "testuser",
		Password: "testpass",
		DBName:   "testdb",
		SSLMode:  "disable",
	}

	expected := "postgres://testuser:testpass@localhost:5432/testdb?sslmode=disable"
	result := config.ConnectionString()

	if result != expected {
		t.Errorf("ConnectionString() = %v, want %v", result, expected)
	}
}

func TestDefaultDBConfig(t *testing.T) {
	// 保存原始环境变量
	originalHost := os.Getenv("DB_HOST")
	originalPort := os.Getenv("DB_PORT")
	originalUser := os.Getenv("DB_USER")
	originalPassword := os.Getenv("DB_PASSWORD")
	originalDBName := os.Getenv("DB_NAME")
	originalSSLMode := os.Getenv("DB_SSLMODE")

	// 测试结束后恢复环境变量
	defer func() {
		os.Setenv("DB_HOST", originalHost)
		os.Setenv("DB_PORT", originalPort)
		os.Setenv("DB_USER", originalUser)
		os.Setenv("DB_PASSWORD", originalPassword)
		os.Setenv("DB_NAME", originalDBName)
		os.Setenv("DB_SSLMODE", originalSSLMode)
	}()

	// 设置测试环境变量
	os.Setenv("DB_HOST", "testhost")
	os.Setenv("DB_PORT", "1234")
	os.Setenv("DB_USER", "testuser")
	os.Setenv("DB_PASSWORD", "testpass")
	os.Setenv("DB_NAME", "testdb")
	os.Setenv("DB_SSLMODE", "require")

	config := DefaultDBConfig()

	if config.Host != "testhost" {
		t.Errorf("Host = %v, want %v", config.Host, "testhost")
	}
	if config.Port != 1234 {
		t.Errorf("Port = %v, want %v", config.Port, 1234)
	}
	if config.User != "testuser" {
		t.Errorf("User = %v, want %v", config.User, "testuser")
	}
	if config.Password != "testpass" {
		t.Errorf("Password = %v, want %v", config.Password, "testpass")
	}
	if config.DBName != "testdb" {
		t.Errorf("DBName = %v, want %v", config.DBName, "testdb")
	}
	if config.SSLMode != "require" {
		t.Errorf("SSLMode = %v, want %v", config.SSLMode, "require")
	}
}

func TestConnectDB(t *testing.T) {
	// 这个测试需要一个实际的数据库连接
	// 如果没有可用的数据库，可以跳过这个测试
	if testing.Short() {
		t.Skip("跳过需要数据库连接的测试")
	}

	// 保存原始环境变量
	originalHost := os.Getenv("DB_HOST")
	originalPort := os.Getenv("DB_PORT")
	originalUser := os.Getenv("DB_USER")
	originalPassword := os.Getenv("DB_PASSWORD")
	originalDBName := os.Getenv("DB_NAME")
	originalSSLMode := os.Getenv("DB_SSLMODE")

	// 测试结束后恢复环境变量
	defer func() {
		os.Setenv("DB_HOST", originalHost)
		os.Setenv("DB_PORT", originalPort)
		os.Setenv("DB_USER", originalUser)
		os.Setenv("DB_PASSWORD", originalPassword)
		os.Setenv("DB_NAME", originalDBName)
		os.Setenv("DB_SSLMODE", originalSSLMode)
	}()

	// 设置测试环境变量 - 使用实际可连接的数据库
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_USER", "postgres")
	os.Setenv("DB_PASSWORD", "postgres")
	os.Setenv("DB_NAME", "tododb")
	os.Setenv("DB_SSLMODE", "disable")

	db, err := ConnectDB()
	if err != nil {
		t.Fatalf("ConnectDB() error = %v", err)
	}
	defer db.Close()

	// 测试数据库连接是否正常
	err = db.Ping()
	if err != nil {
		t.Fatalf("Database ping failed: %v", err)
	}
}