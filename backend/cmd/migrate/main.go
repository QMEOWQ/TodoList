package main

import (
	"database/sql"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	_ "github.com/lib/pq"
)

func main() {
	// 数据库连接字符串 - 使用正确的配置
	dbURLs := []string{
		"postgres://postgres:123456654321K@localhost/todo-list-go+react?sslmode=disable",
		"postgres://postgres:postgres@localhost/tododb?sslmode=disable",
		"postgres://postgres:123456@localhost/todo_db?sslmode=disable",
	}

	// 尝试连接数据库
	var db *sql.DB
	var err error

	for _, dbURL := range dbURLs {
		log.Printf("尝试连接: %s", dbURL)
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Printf("连接失败: %v", err)
			continue
		}

		// 测试连接
		if err := db.Ping(); err != nil {
			log.Printf("连接测试失败: %v", err)
			db.Close()
			continue
		}

		log.Println("数据库连接成功")
		break
	}

	if db == nil {
		log.Fatalf("所有数据库连接尝试都失败了")
	}
	defer db.Close()

	// 执行迁移文件
	migrationFiles := []string{
		"migrations/add_enhanced_fields.sql",
		"migrations/add_verification_system.sql",
	}

	for _, file := range migrationFiles {
		log.Printf("执行迁移文件: %s", file)

		// 检查文件是否存在
		if _, err := os.Stat(file); os.IsNotExist(err) {
			log.Printf("迁移文件不存在: %s", file)
			continue
		}

		// 读取SQL文件
		content, err := ioutil.ReadFile(file)
		if err != nil {
			log.Printf("读取迁移文件失败 %s: %v", file, err)
			continue
		}

		// 执行SQL
		_, err = db.Exec(string(content))
		if err != nil {
			log.Printf("执行迁移失败 %s: %v", file, err)
			continue
		}

		log.Printf("迁移文件执行成功: %s", filepath.Base(file))
	}

	log.Println("所有迁移执行完成")
}
