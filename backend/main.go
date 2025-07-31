package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/TodoList/config"
	"github.com/TodoList/handlers"
	"github.com/TodoList/models"

	"github.com/joho/godotenv"
)

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// 获取JWT密钥
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key" // 默认密钥，生产环境应使用环境变量
	}

	// 连接数据库
	db, err := config.ConnectDB()
	if err != nil {
		log.Printf("数据库连接失败: %v\n", err)
		log.Fatal("无法启动应用程序，数据库连接是必需的")
	}
	defer db.Close()

	// 初始化数据库架构
	if err := config.InitSchema(db); err != nil {
		log.Printf("初始化数据库架构失败: %v\n", err)
		log.Fatal("无法启动应用程序，数据库初始化失败")
	}

	// 创建模型
	todoModel := models.NewTodoModel(db)
	userModel := models.NewUserModel(db)

	// 初始化管理员用户
	if err := userModel.InitAdminUser(); err != nil {
		log.Printf("初始化管理员用户失败: %v\n", err)
	}

	// 创建处理器
	todoHandler := handlers.NewTodoHandler(todoModel)
	enhancedTodoHandler := handlers.NewEnhancedTodoHandler(todoModel)
	userHandler := handlers.NewUserHandler(userModel, jwtSecret)

	// 用户认证路由
	http.HandleFunc("/api/login", handlers.EnableCORS(userHandler.Login))
	http.HandleFunc("/api/register", handlers.EnableCORS(userHandler.Register))
	http.HandleFunc("/api/send-verification-code", handlers.EnableCORS(userHandler.SendVerificationCode))
	http.HandleFunc("/api/users", handlers.EnableCORS(userHandler.AdminMiddleware(userHandler.GetAllUsers)))

	// 主要的待办事项路由
	http.HandleFunc("/api/todos", handlers.EnableCORS(userHandler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			todoHandler.GetAllTodos(w, r)
		case http.MethodPost:
			todoHandler.AddTodo(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// 特定待办事项的路由（带ID）
	http.HandleFunc("/api/todos/", handlers.EnableCORS(userHandler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// 提取路径中的ID
		pathParts := strings.Split(strings.Trim(path, "/"), "/")
		if len(pathParts) < 3 {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}

		// 检查是否是步骤相关的请求
		if len(pathParts) >= 4 && pathParts[3] == "steps" {
			// 处理步骤相关的请求 /api/todos/{id}/steps
			switch r.Method {
			case http.MethodPost:
				todoHandler.AddStep(w, r)
			case http.MethodPut:
				todoHandler.UpdateStep(w, r)
			case http.MethodDelete:
				todoHandler.DeleteStep(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		} else {
			// 处理特定任务的请求 /api/todos/{id}
			todoID, err := strconv.Atoi(pathParts[2])
			if err != nil {
				http.Error(w, "Invalid todo ID", http.StatusBadRequest)
				return
			}

			switch r.Method {
			case http.MethodGet:
				todoHandler.GetTodoByID(w, r, todoID)
			case http.MethodPut:
				todoHandler.UpdateTodo(w, r)
			case http.MethodDelete:
				todoHandler.DeleteTodo(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		}
	})))

	// 切换任务状态
	http.HandleFunc("/api/toggle", handlers.EnableCORS(userHandler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			todoHandler.ToggleTodo(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// 切换步骤状态
	http.HandleFunc("/api/toggle-step", handlers.EnableCORS(userHandler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			todoHandler.ToggleStep(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// 管理员查看用户待办事项路由
	http.HandleFunc("/api/admin/user-todos/", handlers.EnableCORS(userHandler.AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// 从路径中提取用户ID
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) < 4 {
			http.Error(w, "Invalid path", http.StatusBadRequest)
			return
		}

		userID, err := strconv.Atoi(pathParts[3])
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}

		// 获取指定用户的待办事项
		todos, err := todoModel.GetAllTodos(userID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(todos)
	})))

	// 增强API路由
	http.HandleFunc("/api/v2/todos", handlers.EnableCORS(userHandler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			enhancedTodoHandler.GetTodosWithFilter(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// 批量操作路由
	http.HandleFunc("/api/v2/todos/batch", handlers.EnableCORS(userHandler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			enhancedTodoHandler.BatchUpdate(w, r)
		case http.MethodDelete:
			enhancedTodoHandler.BatchDelete(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// 统计信息路由
	http.HandleFunc("/api/v2/todos/stats", handlers.EnableCORS(userHandler.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			enhancedTodoHandler.GetTodoStats(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	log.Println("后端服务运行在 http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
