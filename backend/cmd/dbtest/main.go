package main

import (
	"fmt"
	"log"

	"backend/config"
)

func main() {
	// 尝试连接数据库
	log.Println("正在测试数据库连接...")

	// 获取默认配置
	dbConfig := config.DefaultDBConfig()
	log.Printf("数据库配置: %+v\n", dbConfig)
	log.Printf("连接字符串: %s\n", dbConfig.ConnectionString())

	// 连接数据库
	db, err := config.ConnectDB()
	if err != nil {
		log.Fatalf("数据库连接失败: %v\n", err)
	}
	defer db.Close()

	// 测试数据库连接
	err = db.Ping()
	if err != nil {
		log.Fatalf("数据库连接测试失败: %v\n", err)
	}

	// 初始化数据库架构
	err = config.InitSchema(db)
	if err != nil {
		log.Fatalf("初始化数据库架构失败: %v\n", err)
	}

	fmt.Println("\n数据库连接测试成功!")
	fmt.Println("数据库架构初始化成功!")
}