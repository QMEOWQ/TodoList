package handlers

import (
	"backend/models"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// UserHandler 处理用户相关的HTTP请求
type UserHandler struct {
	Model     *models.UserModel
	JWTSecret string
}

// NewUserHandler 创建一个新的UserHandler实例
func NewUserHandler(model *models.UserModel, jwtSecret string) *UserHandler {
	return &UserHandler{Model: model, JWTSecret: jwtSecret}
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

// TokenResponse 登录成功后的响应
type TokenResponse struct {
	Token     string              `json:"token"`
	User      models.UserResponse `json:"user"`
	ExpiresAt time.Time           `json:"expiresAt"`
}

// Login 用户登录
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// 验证用户名和密码
	user, err := h.Model.VerifyPassword(req.Username, req.Password)
	if err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// 生成JWT令牌
	token, expiresAt, err := h.generateToken(user)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// 返回令牌和用户信息
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TokenResponse{
		Token:     token,
		User:      user.ToResponse(),
		ExpiresAt: expiresAt,
	})
}

// Register 用户注册
func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// 创建新用户
	user := &models.User{
		Username: req.Username,
		Password: req.Password,
		Email:    req.Email,
		IsAdmin:  false, // 普通用户
	}

	err = h.Model.CreateUser(user)
	if err != nil {
		if err.Error() == "username already exists" {
			http.Error(w, "Username already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// 生成JWT令牌
	token, expiresAt, err := h.generateToken(user)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// 返回令牌和用户信息
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(TokenResponse{
		Token:     token,
		User:      user.ToResponse(),
		ExpiresAt: expiresAt,
	})
}

// GetAllUsers 获取所有用户（仅管理员可用）
func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	// 验证是否是管理员
	// userID, isAdmin, err := h.validateToken(r)
	_, isAdmin, err := h.validateToken(r)
	if err != nil || !isAdmin {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 获取所有用户
	users, err := h.Model.GetAllUsers()
	if err != nil {
		http.Error(w, "Failed to get users", http.StatusInternalServerError)
		return
	}

	// 返回用户列表
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// Claims JWT声明
type Claims struct {
	UserID  int  `json:"userId"`
	IsAdmin bool `json:"isAdmin"`
	jwt.RegisteredClaims
}

// generateToken 生成JWT令牌
func (h *UserHandler) generateToken(user *models.User) (string, time.Time, error) {
	// 设置过期时间为24小时
	expiresAt := time.Now().Add(24 * time.Hour)

	// 创建JWT声明
	claims := &Claims{
		UserID:  user.ID,
		IsAdmin: user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.Username,
		},
	}

	// 创建令牌
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 签名令牌
	tokenString, err := token.SignedString([]byte(h.JWTSecret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expiresAt, nil
}

// validateToken 验证JWT令牌
func (h *UserHandler) validateToken(r *http.Request) (int, bool, error) {
	// 从Authorization头获取令牌
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		return 0, false, fmt.Errorf("no token provided")
	}

	// 如果令牌以Bearer开头，去掉前缀
	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	// 解析令牌
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return 0, false, fmt.Errorf("invalid token")
	}

	return claims.UserID, claims.IsAdmin, nil
}

// AuthMiddleware 认证中间件
func (h *UserHandler) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 验证令牌
		userID, _, err := h.validateToken(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// 将用户ID添加到请求上下文
		r = r.WithContext(context.WithValue(r.Context(), "userID", userID))

		// 调用下一个处理器
		next(w, r)
	}
}

// AdminMiddleware 管理员中间件
func (h *UserHandler) AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 验证令牌
		_, isAdmin, err := h.validateToken(r)
		if err != nil || !isAdmin {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// 调用下一个处理器
		next(w, r)
	}
}
