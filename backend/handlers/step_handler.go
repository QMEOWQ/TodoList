package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/TodoList/models"
)

// api/todos/:todoID/steps/:stepID

// StepHandler 处理步骤相关的HTTP请求
type StepHandler struct {
	Model *models.TodoModel
}

// NewStepHandler 创建一个新的StepHandler
func NewStepHandler(model *models.TodoModel) *StepHandler {
	return &StepHandler{Model: model}
}

// AddStep 添加新的步骤
func (h *StepHandler) AddStep(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	todoID, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid todo ID", http.StatusBadRequest)
		return
	}

	var step models.Step
	if err := json.NewDecoder(r.Body).Decode(&step); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	step.TodoID = todoID
	if err := h.Model.AddStep(&step); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(step)
}

// UpdateStep 更新步骤
func (h *StepHandler) UpdateStep(w http.ResponseWriter, r *http.Request) {
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

	var step models.Step
	if err := json.NewDecoder(r.Body).Decode(&step); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	step.ID = stepID
	step.TodoID = todoID
	if err := h.Model.UpdateStep(&step); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(step)
}

// ToggleStep 切换步骤的完成状态
func (h *StepHandler) ToggleStep(w http.ResponseWriter, r *http.Request) {
	var data struct {
		ID int `json:"id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Model.ToggleStep(data.ID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// DeleteStep 删除步骤
func (h *StepHandler) DeleteStep(w http.ResponseWriter, r *http.Request) {
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

	if err := h.Model.DeleteStep(stepID, todoID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// HandleSteps 处理步骤相关的请求
func (h *StepHandler) HandleSteps(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")

	// 检查路径格式是否正确
	if len(parts) < 5 || parts[1] != "api" || parts[2] != "todos" || parts[4] != "steps" {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodPost:
		// 添加步骤: POST /api/todos/{todoId}/steps
		h.AddStep(w, r)
	case http.MethodPut:
		// 更新步骤: PUT /api/todos/{todoId}/steps/{stepId}
		h.UpdateStep(w, r)
	case http.MethodDelete:
		// 删除步骤: DELETE /api/todos/{todoId}/steps/{stepId}
		h.DeleteStep(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
