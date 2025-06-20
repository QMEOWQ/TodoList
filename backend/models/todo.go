package models

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

// Step 表示一个任务步骤
type Step struct {
	ID        int    `json:"id"`
	TodoID    int    `json:"todoId"`
	Content   string `json:"content"`
	Completed bool   `json:"completed"`
}

// todo 表示一个待办事项
type Todo struct {
	ID          int       `json:"id"`
	Task        string    `json:"task"`
	Description string    `json:"description,omitempty"`
	Done        bool      `json:"done"`
	Steps       []Step    `json:"steps,omitempty"`
	UserID      int       `json:"userId"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// TodoModel 处理Todo相关的数据库操作
type TodoModel struct {
	DB *sql.DB
}

// NewTodoModel 创建一个新的TodoModel实例
func NewTodoModel(db *sql.DB) *TodoModel {
	return &TodoModel{DB: db}
}

// GetAllTodos 获取所有待办事项
func (m *TodoModel) GetAllTodos(userID int) ([]Todo, error) {
	var todos []Todo

	// 查询指定用户的所有待办事项
	rows, err := m.DB.Query(
		"SELECT id, task, description, done, created_at, updated_at FROM todos WHERE user_id = $1 ORDER BY created_at DESC",
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("query todos failed: %w", err)
	}
	defer rows.Close()

	// 处理查询结果
	for rows.Next() {
		var todo Todo

		scanErr := rows.Scan(
			&todo.ID,
			&todo.Task,
			&todo.Description,
			&todo.Done,
			&todo.CreatedAt,
			&todo.UpdatedAt,
		)
		if scanErr != nil {
			log.Printf("scan todo failed: %v", scanErr)
			continue
		}

		todo.UserID = userID
		// 获取该任务的所有步骤
		todo.Steps, _ = m.GetStepsByTodoID(todo.ID)
		todos = append(todos, todo)
	}

	return todos, nil
}

// AddTodo 添加一个新的待办事项
func (m *TodoModel) AddTodo(todo *Todo) error {
	// 开始事务
	tx, err := m.DB.Begin()
	if err != nil {
		log.Printf("开始事务失败: %v", err)
		return fmt.Errorf("begin transaction failed: %w", err)
	}

	// 确保事务最终会被处理
	defer func() {
		if err != nil {
			log.Printf("事务回滚: %v", err)
			tx.Rollback()
		}
	}()

	// 插入待办事项
	var todoID int
	log.Printf("插入任务: %s, 描述: %s, 用户ID: %d", todo.Task, todo.Description, todo.UserID)
	err = tx.QueryRow(
		"INSERT INTO todos (task, description, done, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id",
		todo.Task, todo.Description, todo.Done, todo.UserID,
	).Scan(&todoID)

	if err != nil {
		return fmt.Errorf("insert todo failed: %w", err)
	}

	todo.ID = todoID
	log.Printf("任务插入成功，ID: %d", todoID)

	// 插入步骤
	if len(todo.Steps) > 0 {
		log.Printf("开始插入 %d 个步骤", len(todo.Steps))
		for i := range todo.Steps {
			todo.Steps[i].TodoID = todoID
			var stepID int

			log.Printf("插入步骤 %d: %s", i+1, todo.Steps[i].Content)
			err = tx.QueryRow(
				"INSERT INTO steps (todo_id, content, completed) VALUES ($1, $2, $3) RETURNING id",
				todoID, todo.Steps[i].Content, todo.Steps[i].Completed,
			).Scan(&stepID)

			if err != nil {
				return fmt.Errorf("insert step failed: %w", err)
			}

			todo.Steps[i].ID = stepID
			log.Printf("步骤插入成功，ID: %d", stepID)
		}
	}

	// 提交事务
	log.Printf("提交事务")
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction failed: %w", err)
	}

	log.Printf("事务提交成功")
	return nil
}

// UpdateTodo 更新一个待办事项
func (m *TodoModel) UpdateTodo(todo *Todo, userID int) error {
	// 首先检查待办事项是否属于该用户
	var ownerID int
	err := m.DB.QueryRow("SELECT user_id FROM todos WHERE id = $1", todo.ID).Scan(&ownerID)
	if err != nil {
		return fmt.Errorf("verify todo ownership failed: %w", err)
	}

	// 如果待办事项不属于该用户，返回错误
	if ownerID != userID {
		return fmt.Errorf("unauthorized: todo does not belong to user")
	}

	// 开始事务
	tx, err := m.DB.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction failed: %w", err)
	}

	// 更新待办事项
	_, err = tx.Exec(
		"UPDATE todos SET task = $1, description = $2 WHERE id = $3 AND user_id = $4",
		todo.Task, todo.Description, todo.ID, userID,
	)

	if err != nil {
		tx.Rollback()
		return fmt.Errorf("update todo failed: %w", err)
	}

	// 如果提供了步骤，则更新步骤
	if todo.Steps != nil {
		// 删除旧步骤
		_, err = tx.Exec("DELETE FROM steps WHERE todo_id = $1", todo.ID)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("delete old steps failed: %w", err)
		}

		// 添加新步骤
		for i := range todo.Steps {
			todo.Steps[i].TodoID = todo.ID
			var stepID int

			err = tx.QueryRow(
				"INSERT INTO steps (todo_id, content, completed) VALUES ($1, $2, $3) RETURNING id",
				todo.ID, todo.Steps[i].Content, todo.Steps[i].Completed,
			).Scan(&stepID)

			if err != nil {
				tx.Rollback()
				return fmt.Errorf("insert step failed: %w", err)
			}

			todo.Steps[i].ID = stepID
		}
	}

	// 提交事务
	if err = tx.Commit(); err != nil {
		tx.Rollback()
		return fmt.Errorf("commit transaction failed: %w", err)
	}

	return nil
}

// ToggleTodo 切换待办事项的完成状态
func (m *TodoModel) ToggleTodo(id int) error {
	_, err := m.DB.Exec(
		"UPDATE todos SET done = NOT done WHERE id = $1",
		id,
	)

	if err != nil {
		return fmt.Errorf("toggle todo failed: %w", err)
	}

	return nil
}

// DeleteTodo 删除待办事项
func (m *TodoModel) DeleteTodo(id int, userID int) error {
	// 首先检查待办事项是否属于该用户
	var ownerID int
	err := m.DB.QueryRow("SELECT user_id FROM todos WHERE id = $1", id).Scan(&ownerID)
	if err != nil {
		return fmt.Errorf("verify todo ownership failed: %w", err)
	}

	// 如果待办事项不属于该用户，返回错误
	if ownerID != userID {
		return fmt.Errorf("unauthorized: todo does not belong to user")
	}

	// 由于设置了外键约束，删除待办事项时会自动删除相关步骤
	_, err = m.DB.Exec(
		"DELETE FROM todos WHERE id = $1 AND user_id = $2", id, userID,
	)
	if err != nil {
		return fmt.Errorf("delete todo failed: %w", err)
	}

	return nil
}

// AddStep 添加步骤
func (m *TodoModel) AddStep(step *Step) error {
	var stepID int

	err := m.DB.QueryRow(
		"INSERT INTO steps (todo_id, content, completed) VALUES ($1, $2, $3) RETURNING id",
		step.TodoID, step.Content, step.Completed,
	).Scan(&stepID)

	if err != nil {
		return fmt.Errorf("insert step failed: %w", err)
	}

	step.ID = stepID
	return nil
}

// UpdateStep 更新步骤
func (m *TodoModel) UpdateStep(step *Step) error {
	_, err := m.DB.Exec(
		"UPDATE steps SET content = $1 WHERE id = $2 AND todo_id = $3",
		step.Content, step.ID, step.TodoID,
	)

	if err != nil {
		return fmt.Errorf("update step failed: %w", err)
	}

	return nil
}

// ToggleStep 切换步骤的完成状态
func (m *TodoModel) ToggleStep(id int) error {
	_, err := m.DB.Exec(
		"UPDATE steps SET completed = NOT completed WHERE id = $1",
		id,
	)

	if err != nil {
		return fmt.Errorf("toggle step failed: %w", err)
	}

	return nil
}

// DeleteStep 删除步骤
func (m *TodoModel) DeleteStep(id int, todoID int) error {
	_, err := m.DB.Exec(
		"DELETE FROM steps WHERE id = $1 AND todo_id = $2",
		id, todoID,
	)

	if err != nil {
		return fmt.Errorf("delete step failed: %w", err)
	}

	return nil
}

// GetTodoByID 根据ID获取单个待办事项
func (m *TodoModel) GetTodoByID(id int) (*Todo, error) {
	var todo Todo

	// 查询待办事项
	err := m.DB.QueryRow(
		"SELECT id, task, description, done FROM todos WHERE id = $1",
		id,
	).Scan(
		&todo.ID,
		&todo.Task,
		&todo.Description,
		&todo.Done,
	)

	if err != nil {
		return nil, fmt.Errorf("get todo by id failed: %w", err)
	}

	// 获取该任务的所有步骤
	steps, err := m.GetStepsByTodoID(todo.ID)
	if err != nil {
		log.Printf("获取步骤失败: %v", err)
		// 即使获取步骤失败，我们仍然返回任务本身
	} else {
		todo.Steps = steps
	}

	return &todo, nil
}

// GetStepsByTodoID 根据待办事项ID获取所有步骤
func (m *TodoModel) GetStepsByTodoID(todoID int) ([]Step, error) {
	var steps []Step

	rows, err := m.DB.Query(
		"SELECT id, todo_id, content, completed FROM steps WHERE todo_id = $1 ORDER BY id",
		todoID,
	)
	if err != nil {
		return nil, fmt.Errorf("query steps failed: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var step Step
		scanErr := rows.Scan(
			&step.ID,
			&step.TodoID,
			&step.Content,
			&step.Completed,
		)
		if scanErr != nil {
			log.Printf("scan step failed: %v", scanErr)
			continue
		}
		steps = append(steps, step)
	}

	return steps, nil
}
