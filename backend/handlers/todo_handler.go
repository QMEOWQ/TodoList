package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/TodoList/models"
)

// TodoHandler 处理待办事项相关的HTTP请求
type TodoHandler struct {
	Model *models.TodoModel
}

// NewTodoHandler 创建一个新的TodoHandler实例
func NewTodoHandler(model *models.TodoModel) *TodoHandler {
	return &TodoHandler{Model: model}
}

// EnableCORS 添加CORS头信息
func EnableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 允许多个前端端口
		origin := r.Header.Get("Origin")
		log.Printf("CORS请求: %s %s, Origin: %s", r.Method, r.URL.Path, origin)

		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3002",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:3001",
			"http://127.0.0.1:3002",
		}

		// 检查请求来源是否在允许列表中
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				log.Printf("允许来源: %s", origin)
				break
			}
		}

		// 如果没有Origin头或不在允许列表中，设置默认值
		if w.Header().Get("Access-Control-Allow-Origin") == "" {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			log.Printf("使用默认来源: http://localhost:3000")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			log.Printf("处理OPTIONS预检请求")
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// GetAllTodos 获取所有待办事项
func (h *TodoHandler) GetAllTodos(w http.ResponseWriter, r *http.Request) {
	// 从上下文中获取用户ID
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	todos, err := h.Model.GetAllTodos(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todos)
}

// AddTodo 添加新的待办事项
// AddTodo 添加新的待办事项
func (h *TodoHandler) AddTodo(w http.ResponseWriter, r *http.Request) {
	// 从上下文中获取用户ID
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, "{\"error\":\"Unauthorized\"}", http.StatusUnauthorized)
		return
	}

	var todo models.Todo

	// 记录请求体
	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("读取请求体失败: %v", err)
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, fmt.Sprintf("{\"error\":\"%s\"}", err.Error()), http.StatusBadRequest)
		return
	}
	r.Body = io.NopCloser(bytes.NewBuffer(requestBody))
	log.Printf("收到的请求体: %s", string(requestBody))

	err = json.NewDecoder(r.Body).Decode(&todo)
	if err != nil {
		log.Printf("解析JSON失败: %v", err)
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, fmt.Sprintf("{\"error\":\"%s\"}", err.Error()), http.StatusBadRequest)
		return
	}

	log.Printf("解析后的任务: %+v, 步骤数量: %d", todo, len(todo.Steps))

	// 设置用户ID
	todo.UserID = userID

	// 确保任务名称不为空
	if todo.Task == "" {
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, "{\"error\":\"任务名称不能为空\"}", http.StatusBadRequest)
		return
	}

	err = h.Model.AddTodo(&todo)
	if err != nil {
		log.Printf("添加任务失败: %v", err)
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, fmt.Sprintf("{\"error\":\"%s\"}", err.Error()), http.StatusInternalServerError)
		return
	}

	log.Printf("任务添加成功，ID: %d", todo.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(todo)
}

// UpdateTodo 更新待办事项
func (h *TodoHandler) UpdateTodo(w http.ResponseWriter, r *http.Request) {
	// 从上下文中获取用户ID
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var todo models.Todo

	// 记录请求体
	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("读取请求体失败: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	r.Body = io.NopCloser(bytes.NewBuffer(requestBody))
	log.Printf("收到的更新请求体: %s", string(requestBody))

	err = json.NewDecoder(r.Body).Decode(&todo)
	if err != nil {
		log.Printf("解析JSON失败: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("解析后的更新任务: %+v, 步骤数量: %d", todo, len(todo.Steps))

	// 设置用户ID
	todo.UserID = userID

	err = h.Model.UpdateTodo(&todo, userID)
	if err != nil {
		if err.Error() == "unauthorized: todo does not belong to user" {
			http.Error(w, "Unauthorized: You can only update your own todos", http.StatusForbidden)
			return
		}
		log.Printf("更新任务失败: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("任务更新成功，ID: %d", todo.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todo)
}

// ToggleTodo 切换待办事项的完成状态
func (h *TodoHandler) ToggleTodo(w http.ResponseWriter, r *http.Request) {
	var data struct {
		ID int `json:"id"`
	}

	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = h.Model.ToggleTodo(data.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// DeleteTodo 删除待办事项
func (h *TodoHandler) DeleteTodo(w http.ResponseWriter, r *http.Request) {
	// 从上下文中获取用户ID
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	err = h.Model.DeleteTodo(id, userID)
	if err != nil {
		if err.Error() == "unauthorized: todo does not belong to user" {
			http.Error(w, "Unauthorized: You can only delete your own todos", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// AddStep 添加步骤
func (h *TodoHandler) AddStep(w http.ResponseWriter, r *http.Request) {
	var step models.Step

	// 记录请求体
	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("读取请求体失败: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	r.Body = io.NopCloser(bytes.NewBuffer(requestBody))
	log.Printf("收到的步骤请求体: %s", string(requestBody))

	err = json.NewDecoder(r.Body).Decode(&step)
	if err != nil {
		log.Printf("解析JSON失败: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("解析后的步骤: %+v", step)

	err = h.Model.AddStep(&step)
	if err != nil {
		log.Printf("添加步骤失败: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("步骤添加成功，ID: %d", step.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(step)
}

// UpdateStep 更新步骤
func (h *TodoHandler) UpdateStep(w http.ResponseWriter, r *http.Request) {
	var step models.Step
	err := json.NewDecoder(r.Body).Decode(&step)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = h.Model.UpdateStep(&step)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(step)
}

// ToggleStep 切换步骤的完成状态
func (h *TodoHandler) ToggleStep(w http.ResponseWriter, r *http.Request) {
	var data struct {
		ID int `json:"id"`
	}

	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = h.Model.ToggleStep(data.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// DeleteStep 删除步骤
func (h *TodoHandler) DeleteStep(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 6 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	todoID, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid todo ID", http.StatusBadRequest)
		return
	}

	stepID, err := strconv.Atoi(parts[5])
	if err != nil {
		http.Error(w, "Invalid step ID", http.StatusBadRequest)
		return
	}

	err = h.Model.DeleteStep(stepID, todoID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// HandleTodoRoutes 处理所有与待办事项相关的路由
func (h *TodoHandler) HandleTodoRoutes(w http.ResponseWriter, r *http.Request) {
	// 解析路径
	parts := strings.Split(r.URL.Path, "/")

	// 处理 /api/todos 路径
	if len(parts) == 3 || (len(parts) == 4 && parts[3] == "") {
		switch r.Method {
		case http.MethodGet:
			h.GetAllTodos(w, r)
		case http.MethodPost:
			h.AddTodo(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	// 处理 /api/todos/{id} 路径
	if len(parts) == 4 {
		todoID, err := strconv.Atoi(parts[3])
		if err != nil {
			http.Error(w, "Invalid todo ID", http.StatusBadRequest)
			return
		}

		switch r.Method {
		case http.MethodGet:
			h.GetTodoByID(w, r, todoID)
		case http.MethodPut:
			h.UpdateTodo(w, r)
		case http.MethodDelete:
			h.DeleteTodo(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	// 处理 /api/todos/{id}/steps 路径
	if len(parts) == 5 && parts[4] == "steps" {
		switch r.Method {
		case http.MethodPost:
			h.AddStep(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	// 处理 /api/todos/{id}/steps/{stepId} 路径
	if len(parts) == 6 && parts[4] == "steps" {
		switch r.Method {
		case http.MethodPut:
			h.UpdateStep(w, r)
		case http.MethodDelete:
			h.DeleteStep(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	http.Error(w, "Not found", http.StatusNotFound)
}

// GetTodoByID 根据ID获取单个待办事项
func (h *TodoHandler) GetTodoByID(w http.ResponseWriter, r *http.Request, todoID int) {
	todo, err := h.Model.GetTodoByID(todoID)
	if err != nil {
		log.Printf("获取任务失败，ID: %d, 错误: %v", todoID, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todo)
}
