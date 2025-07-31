package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/TodoList/models"
)

// EnhancedTodoHandler 增强的待办事项处理器
type EnhancedTodoHandler struct {
	Model *models.TodoModel
}

// NewEnhancedTodoHandler 创建新的增强处理器
func NewEnhancedTodoHandler(model *models.TodoModel) *EnhancedTodoHandler {
	return &EnhancedTodoHandler{Model: model}
}

// BatchUpdateRequest 批量更新请求
type BatchUpdateRequest struct {
	TodoIDs []int                  `json:"todoIds"`
	Updates map[string]interface{} `json:"updates"`
}

// BatchDeleteRequest 批量删除请求
type BatchDeleteRequest struct {
	TodoIDs []int `json:"todoIds"`
}

// FilterParams 过滤参数
type FilterParams struct {
	Status      string     `json:"status"`      // all, completed, pending
	Priority    string     `json:"priority"`    // all, high, medium, low
	Category    string     `json:"category"`    // all, work, personal, etc.
	Search      string     `json:"search"`      // 搜索关键词
	SortBy      string     `json:"sortBy"`      // createdAt, updatedAt, priority, alphabetical
	SortOrder   string     `json:"sortOrder"`   // asc, desc
	Page        int        `json:"page"`        // 页码
	PageSize    int        `json:"pageSize"`    // 每页大小
	DueDateFrom *time.Time `json:"dueDateFrom"` // 截止日期范围开始
	DueDateTo   *time.Time `json:"dueDateTo"`   // 截止日期范围结束
}

// GetTodosWithFilter 获取带过滤的待办事项
func (h *EnhancedTodoHandler) GetTodosWithFilter(w http.ResponseWriter, r *http.Request) {
	// 从上下文中获取用户ID
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 解析查询参数
	filters := parseFilterParams(r)

	// 构建查询
	query, args := buildFilterQuery(userID, filters)

	// 执行查询
	todos, total, err := h.executeFilterQuery(query, args, filters)
	if err != nil {
		log.Printf("查询失败: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// 构建响应
	response := map[string]interface{}{
		"todos": todos,
		"pagination": map[string]interface{}{
			"total":    total,
			"page":     filters.Page,
			"pageSize": filters.PageSize,
			"hasMore":  (filters.Page * filters.PageSize) < total,
		},
		"filters": filters,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// BatchUpdate 批量更新待办事项
func (h *EnhancedTodoHandler) BatchUpdate(w http.ResponseWriter, r *http.Request) {
	// 从上下文中获取用户ID
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req BatchUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.TodoIDs) == 0 {
		http.Error(w, "No todo IDs provided", http.StatusBadRequest)
		return
	}

	// 验证所有待办事项都属于当前用户
	if !h.validateTodoOwnership(req.TodoIDs, userID) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// 执行批量更新
	err := h.executeBatchUpdate(req.TodoIDs, req.Updates)
	if err != nil {
		log.Printf("批量更新失败: %v", err)
		http.Error(w, "Batch update failed", http.StatusInternalServerError)
		return
	}

	// 返回更新后的待办事项
	updatedTodos, err := h.getTodosByIDs(req.TodoIDs)
	if err != nil {
		log.Printf("获取更新后的待办事项失败: %v", err)
		http.Error(w, "Failed to fetch updated todos", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Successfully updated %d todos", len(req.TodoIDs)),
		"todos":   updatedTodos,
	})
}

// BatchDelete 批量删除待办事项
func (h *EnhancedTodoHandler) BatchDelete(w http.ResponseWriter, r *http.Request) {
	// 从上下文中获取用户ID
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req BatchDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.TodoIDs) == 0 {
		http.Error(w, "No todo IDs provided", http.StatusBadRequest)
		return
	}

	// 验证所有待办事项都属于当前用户
	if !h.validateTodoOwnership(req.TodoIDs, userID) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// 执行批量删除
	err := h.executeBatchDelete(req.TodoIDs)
	if err != nil {
		log.Printf("批量删除失败: %v", err)
		http.Error(w, "Batch delete failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"message":    fmt.Sprintf("Successfully deleted %d todos", len(req.TodoIDs)),
		"deletedIds": req.TodoIDs,
	})
}

// GetTodoStats 获取待办事项统计信息
func (h *EnhancedTodoHandler) GetTodoStats(w http.ResponseWriter, r *http.Request) {
	// 从上下文中获取用户ID
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	stats, err := h.calculateTodoStats(userID)
	if err != nil {
		log.Printf("计算统计信息失败: %v", err)
		http.Error(w, "Failed to calculate stats", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// parseFilterParams 解析过滤参数
func parseFilterParams(r *http.Request) FilterParams {
	params := FilterParams{
		Status:    getQueryParam(r, "status", "all"),
		Priority:  getQueryParam(r, "priority", "all"),
		Category:  getQueryParam(r, "category", "all"),
		Search:    getQueryParam(r, "search", ""),
		SortBy:    getQueryParam(r, "sortBy", "createdAt"),
		SortOrder: getQueryParam(r, "sortOrder", "desc"),
		Page:      getQueryParamInt(r, "page", 1),
		PageSize:  getQueryParamInt(r, "pageSize", 20),
	}

	// 解析日期参数
	if dueDateFrom := r.URL.Query().Get("dueDateFrom"); dueDateFrom != "" {
		if t, err := time.Parse(time.RFC3339, dueDateFrom); err == nil {
			params.DueDateFrom = &t
		}
	}

	if dueDateTo := r.URL.Query().Get("dueDateTo"); dueDateTo != "" {
		if t, err := time.Parse(time.RFC3339, dueDateTo); err == nil {
			params.DueDateTo = &t
		}
	}

	return params
}

// getQueryParam 获取查询参数
func getQueryParam(r *http.Request, key, defaultValue string) string {
	if value := r.URL.Query().Get(key); value != "" {
		return value
	}
	return defaultValue
}

// getQueryParamInt 获取整数查询参数
func getQueryParamInt(r *http.Request, key string, defaultValue int) int {
	if value := r.URL.Query().Get(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// buildFilterQuery 构建过滤查询
func buildFilterQuery(userID int, filters FilterParams) (string, []interface{}) {
	var conditions []string
	var args []interface{}
	argIndex := 1

	// 基础条件：用户ID
	conditions = append(conditions, fmt.Sprintf("user_id = $%d", argIndex))
	args = append(args, userID)
	argIndex++

	// 状态过滤
	if filters.Status != "all" {
		if filters.Status == "completed" {
			conditions = append(conditions, fmt.Sprintf("done = $%d", argIndex))
			args = append(args, true)
		} else if filters.Status == "pending" {
			conditions = append(conditions, fmt.Sprintf("done = $%d", argIndex))
			args = append(args, false)
		}
		argIndex++
	}

	// 优先级过滤
	if filters.Priority != "all" {
		conditions = append(conditions, fmt.Sprintf("priority = $%d", argIndex))
		args = append(args, filters.Priority)
		argIndex++
	}

	// 分类过滤
	if filters.Category != "all" {
		conditions = append(conditions, fmt.Sprintf("category = $%d", argIndex))
		args = append(args, filters.Category)
		argIndex++
	}

	// 搜索过滤
	if filters.Search != "" {
		searchCondition := fmt.Sprintf("(task ILIKE $%d OR description ILIKE $%d)", argIndex, argIndex)
		conditions = append(conditions, searchCondition)
		args = append(args, "%"+filters.Search+"%")
		argIndex++
	}

	// 截止日期范围过滤
	if filters.DueDateFrom != nil {
		conditions = append(conditions, fmt.Sprintf("due_date >= $%d", argIndex))
		args = append(args, *filters.DueDateFrom)
		argIndex++
	}

	if filters.DueDateTo != nil {
		conditions = append(conditions, fmt.Sprintf("due_date <= $%d", argIndex))
		args = append(args, *filters.DueDateTo)
		argIndex++
	}

	// 构建WHERE子句
	whereClause := "WHERE " + strings.Join(conditions, " AND ")

	// 构建ORDER BY子句
	orderBy := "ORDER BY "
	switch filters.SortBy {
	case "priority":
		orderBy += "CASE WHEN priority = 'high' THEN 1 WHEN priority = 'medium' THEN 2 WHEN priority = 'low' THEN 3 ELSE 4 END"
	case "alphabetical":
		orderBy += "task"
	case "updatedAt":
		orderBy += "updated_at"
	default:
		orderBy += "created_at"
	}

	if filters.SortOrder == "asc" {
		orderBy += " ASC"
	} else {
		orderBy += " DESC"
	}

	// 构建LIMIT和OFFSET
	offset := (filters.Page - 1) * filters.PageSize
	limitClause := fmt.Sprintf("LIMIT %d OFFSET %d", filters.PageSize, offset)

	// 完整查询
	query := fmt.Sprintf(`
		SELECT id, task, description, done, priority, category, due_date,
		       reminder, estimated_time, tags, created_at, updated_at, completed_at
		FROM todos
		%s
		%s
		%s
	`, whereClause, orderBy, limitClause)

	return query, args
}

// executeFilterQuery 执行过滤查询
func (h *EnhancedTodoHandler) executeFilterQuery(query string, args []interface{}, filters FilterParams) ([]models.Todo, int, error) {
	// 首先获取总数
	countQuery := strings.Replace(query,
		"SELECT id, task, description, done, priority, category, due_date, reminder, estimated_time, tags, created_at, updated_at, completed_at",
		"SELECT COUNT(*)", 1)
	// 移除LIMIT和OFFSET
	if idx := strings.Index(countQuery, "LIMIT"); idx != -1 {
		countQuery = countQuery[:idx]
	}

	var total int
	err := h.Model.DB.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count query failed: %w", err)
	}

	// 执行主查询
	rows, err := h.Model.DB.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("main query failed: %w", err)
	}
	defer rows.Close()

	var todos []models.Todo
	for rows.Next() {
		var todo models.Todo
		var tagsJSON string

		err := rows.Scan(
			&todo.ID,
			&todo.Task,
			&todo.Description,
			&todo.Done,
			&todo.Priority,
			&todo.Category,
			&todo.DueDate,
			&todo.Reminder,
			&todo.EstimatedTime,
			&tagsJSON,
			&todo.CreatedAt,
			&todo.UpdatedAt,
			&todo.CompletedAt,
		)
		if err != nil {
			log.Printf("scan todo failed: %v", err)
			continue
		}

		// 解析标签
		if tagsJSON != "" {
			if err := json.Unmarshal([]byte(tagsJSON), &todo.Tags); err != nil {
				log.Printf("parse tags failed: %v", err)
				todo.Tags = []string{}
			}
		}

		// 获取步骤
		todo.Steps, _ = h.Model.GetStepsByTodoID(todo.ID)
		todos = append(todos, todo)
	}

	return todos, total, nil
}

// validateTodoOwnership 验证待办事项所有权
func (h *EnhancedTodoHandler) validateTodoOwnership(todoIDs []int, userID int) bool {
	if len(todoIDs) == 0 {
		return false
	}

	// 构建查询，检查所有待办事项是否都属于当前用户
	placeholders := make([]string, len(todoIDs))
	args := make([]interface{}, len(todoIDs)+1)
	args[0] = userID

	for i, id := range todoIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+2)
		args[i+1] = id
	}

	query := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM todos
		WHERE user_id = $1 AND id IN (%s)
	`, strings.Join(placeholders, ","))

	var count int
	err := h.Model.DB.QueryRow(query, args...).Scan(&count)
	if err != nil {
		log.Printf("验证待办事项所有权失败: %v", err)
		return false
	}

	// 如果查询到的数量等于传入的ID数量，说明所有待办事项都属于当前用户
	return count == len(todoIDs)
}

// executeBatchUpdate 执行批量更新
func (h *EnhancedTodoHandler) executeBatchUpdate(todoIDs []int, updates map[string]interface{}) error {
	if len(todoIDs) == 0 || len(updates) == 0 {
		return fmt.Errorf("no todos or updates provided")
	}

	// 构建更新语句
	var setParts []string
	var args []interface{}
	argIndex := 1

	// 处理更新字段
	for key, value := range updates {
		switch key {
		case "done", "priority", "category", "reminder":
			setParts = append(setParts, fmt.Sprintf("%s = $%d", key, argIndex))
			args = append(args, value)
			argIndex++
		case "description", "task":
			setParts = append(setParts, fmt.Sprintf("%s = $%d", key, argIndex))
			args = append(args, value)
			argIndex++
		case "dueDate":
			setParts = append(setParts, fmt.Sprintf("due_date = $%d", argIndex))
			args = append(args, value)
			argIndex++
		case "estimatedTime":
			setParts = append(setParts, fmt.Sprintf("estimated_time = $%d", argIndex))
			args = append(args, value)
			argIndex++
		}
	}

	if len(setParts) == 0 {
		return fmt.Errorf("no valid update fields provided")
	}

	// 添加updated_at字段
	setParts = append(setParts, "updated_at = NOW()")

	// 如果更新done为true，设置completed_at
	if done, ok := updates["done"].(bool); ok && done {
		setParts = append(setParts, "completed_at = NOW()")
	}

	// 构建WHERE子句
	placeholders := make([]string, len(todoIDs))
	for i, id := range todoIDs {
		placeholders[i] = fmt.Sprintf("$%d", argIndex)
		args = append(args, id)
		argIndex++
	}

	query := fmt.Sprintf(`
		UPDATE todos
		SET %s
		WHERE id IN (%s)
	`, strings.Join(setParts, ", "), strings.Join(placeholders, ","))

	_, err := h.Model.DB.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("batch update failed: %w", err)
	}

	return nil
}

// executeBatchDelete 执行批量删除
func (h *EnhancedTodoHandler) executeBatchDelete(todoIDs []int) error {
	if len(todoIDs) == 0 {
		return fmt.Errorf("no todo IDs provided")
	}

	// 构建删除语句
	placeholders := make([]string, len(todoIDs))
	args := make([]interface{}, len(todoIDs))

	for i, id := range todoIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(`
		DELETE FROM todos
		WHERE id IN (%s)
	`, strings.Join(placeholders, ","))

	_, err := h.Model.DB.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("batch delete failed: %w", err)
	}

	return nil
}

// getTodosByIDs 根据ID列表获取待办事项
func (h *EnhancedTodoHandler) getTodosByIDs(todoIDs []int) ([]models.Todo, error) {
	if len(todoIDs) == 0 {
		return []models.Todo{}, nil
	}

	// 构建查询
	placeholders := make([]string, len(todoIDs))
	args := make([]interface{}, len(todoIDs))

	for i, id := range todoIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(`
		SELECT id, task, description, done, priority, category, due_date,
		       reminder, estimated_time, tags, created_at, updated_at, completed_at
		FROM todos
		WHERE id IN (%s)
		ORDER BY created_at DESC
	`, strings.Join(placeholders, ","))

	rows, err := h.Model.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("query todos by IDs failed: %w", err)
	}
	defer rows.Close()

	var todos []models.Todo
	for rows.Next() {
		var todo models.Todo
		var tagsJSON string

		err := rows.Scan(
			&todo.ID,
			&todo.Task,
			&todo.Description,
			&todo.Done,
			&todo.Priority,
			&todo.Category,
			&todo.DueDate,
			&todo.Reminder,
			&todo.EstimatedTime,
			&tagsJSON,
			&todo.CreatedAt,
			&todo.UpdatedAt,
			&todo.CompletedAt,
		)
		if err != nil {
			log.Printf("scan todo failed: %v", err)
			continue
		}

		// 解析标签
		if tagsJSON != "" {
			if err := json.Unmarshal([]byte(tagsJSON), &todo.Tags); err != nil {
				log.Printf("parse tags failed: %v", err)
				todo.Tags = []string{}
			}
		}

		// 获取步骤
		todo.Steps, _ = h.Model.GetStepsByTodoID(todo.ID)
		todos = append(todos, todo)
	}

	return todos, nil
}

// calculateTodoStats 计算待办事项统计信息
func (h *EnhancedTodoHandler) calculateTodoStats(userID int) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// 基础统计查询
	basicStatsQuery := `
		SELECT
			COUNT(*) as total,
			COUNT(CASE WHEN done = true THEN 1 END) as completed,
			COUNT(CASE WHEN done = false THEN 1 END) as pending,
			COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
			COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
			COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority
		FROM todos
		WHERE user_id = $1
	`

	var total, completed, pending, highPriority, mediumPriority, lowPriority int
	err := h.Model.DB.QueryRow(basicStatsQuery, userID).Scan(
		&total, &completed, &pending, &highPriority, &mediumPriority, &lowPriority,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get basic stats: %w", err)
	}

	// 计算完成率
	completionRate := 0.0
	if total > 0 {
		completionRate = float64(completed) / float64(total) * 100
	}

	// 今日任务统计
	todayStatsQuery := `
		SELECT
			COUNT(*) as today_total,
			COUNT(CASE WHEN done = true THEN 1 END) as today_completed
		FROM todos
		WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE
	`

	var todayTotal, todayCompleted int
	err = h.Model.DB.QueryRow(todayStatsQuery, userID).Scan(&todayTotal, &todayCompleted)
	if err != nil {
		return nil, fmt.Errorf("failed to get today stats: %w", err)
	}

	// 分类统计
	categoryStatsQuery := `
		SELECT category, COUNT(*) as count
		FROM todos
		WHERE user_id = $1
		GROUP BY category
		ORDER BY count DESC
	`

	rows, err := h.Model.DB.Query(categoryStatsQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get category stats: %w", err)
	}
	defer rows.Close()

	categoryStats := make(map[string]int)
	for rows.Next() {
		var category string
		var count int
		if err := rows.Scan(&category, &count); err != nil {
			log.Printf("scan category stats failed: %v", err)
			continue
		}
		categoryStats[category] = count
	}

	// 最近7天完成任务统计
	weeklyStatsQuery := `
		SELECT DATE(completed_at) as date, COUNT(*) as count
		FROM todos
		WHERE user_id = $1
		AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
		AND done = true
		GROUP BY DATE(completed_at)
		ORDER BY date DESC
	`

	rows, err = h.Model.DB.Query(weeklyStatsQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get weekly stats: %w", err)
	}
	defer rows.Close()

	weeklyStats := make([]map[string]interface{}, 0)
	for rows.Next() {
		var date time.Time
		var count int
		if err := rows.Scan(&date, &count); err != nil {
			log.Printf("scan weekly stats failed: %v", err)
			continue
		}
		weeklyStats = append(weeklyStats, map[string]interface{}{
			"date":  date.Format("2006-01-02"),
			"count": count,
		})
	}

	// 即将到期的任务
	upcomingQuery := `
		SELECT COUNT(*)
		FROM todos
		WHERE user_id = $1
		AND done = false
		AND due_date IS NOT NULL
		AND due_date <= CURRENT_DATE + INTERVAL '3 days'
	`

	var upcomingCount int
	err = h.Model.DB.QueryRow(upcomingQuery, userID).Scan(&upcomingCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get upcoming tasks: %w", err)
	}

	// 过期任务
	overdueQuery := `
		SELECT COUNT(*)
		FROM todos
		WHERE user_id = $1
		AND done = false
		AND due_date IS NOT NULL
		AND due_date < CURRENT_DATE
	`

	var overdueCount int
	err = h.Model.DB.QueryRow(overdueQuery, userID).Scan(&overdueCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get overdue tasks: %w", err)
	}

	// 构建统计结果
	stats["total"] = total
	stats["completed"] = completed
	stats["pending"] = pending
	stats["completionRate"] = completionRate
	stats["priority"] = map[string]int{
		"high":   highPriority,
		"medium": mediumPriority,
		"low":    lowPriority,
	}
	stats["today"] = map[string]int{
		"total":     todayTotal,
		"completed": todayCompleted,
	}
	stats["categories"] = categoryStats
	stats["weekly"] = weeklyStats
	stats["upcoming"] = upcomingCount
	stats["overdue"] = overdueCount

	// 计算连续完成天数（简化版本）
	streakQuery := `
		SELECT COUNT(DISTINCT DATE(completed_at))
		FROM todos
		WHERE user_id = $1
		AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
		AND done = true
	`

	var streakDays int
	err = h.Model.DB.QueryRow(streakQuery, userID).Scan(&streakDays)
	if err != nil {
		streakDays = 0
	}
	stats["streakDays"] = streakDays

	return stats, nil
}
