package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/TodoList/models"

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
	Username         string `json:"username"`
	Password         string `json:"password"`
	Email            string `json:"email"`
	VerificationCode string `json:"verificationCode"`
}

// SendCodeRequest 发送验证码请求
type SendCodeRequest struct {
	Email   string `json:"email"`
	Purpose string `json:"purpose"` // registration, password_reset
}

// VerifyCodeRequest 验证验证码请求
type VerifyCodeRequest struct {
	Email   string `json:"email"`
	Code    string `json:"code"`
	Purpose string `json:"purpose"`
}

// TokenResponse 登录成功后的响应
type TokenResponse struct {
	Token     string              `json:"token"`
	User      models.UserResponse `json:"user"`
	ExpiresAt time.Time           `json:"expiresAt"`
}

// Login 用户登录
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	log.Printf("收到登录请求，方法: %s, 来源: %s", r.Method, r.Header.Get("Origin"))

	var req LoginRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("解析登录请求失败: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "请求格式无效",
		})
		return
	}

	log.Printf("尝试登录用户: %s", req.Username)

	// 验证用户名和密码
	user, err := h.Model.VerifyPassword(req.Username, req.Password)
	if err != nil {
		log.Printf("用户验证失败: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "用户名或密码错误",
		})
		return
	}

	// 生成JWT令牌
	token, expiresAt, err := h.generateToken(user)
	if err != nil {
		log.Printf("生成令牌失败: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "生成令牌失败",
		})
		return
	}

	log.Printf("用户 %s 登录成功", req.Username)

	// 返回令牌和用户信息
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TokenResponse{
		Token:     token,
		User:      user.ToResponse(),
		ExpiresAt: expiresAt,
	})
}

// SendVerificationCode 发送验证码
func (h *UserHandler) SendVerificationCode(w http.ResponseWriter, r *http.Request) {
	var req SendCodeRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("解析发送验证码请求失败: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "请求格式无效",
		})
		return
	}

	// 验证邮箱格式
	if req.Email == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "邮箱地址不能为空",
		})
		return
	}

	// 设置默认用途
	if req.Purpose == "" {
		req.Purpose = "registration"
	}

	// 生成验证码
	verificationCode, err := h.Model.GenerateVerificationCode(req.Email, req.Purpose)
	if err != nil {
		log.Printf("生成验证码失败: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "生成验证码失败",
		})
		return
	}

	// 这里应该发送邮件，但为了演示，我们直接在日志中显示验证码
	log.Printf("验证码已生成 - 邮箱: %s, 验证码: %s, 用途: %s", req.Email, verificationCode.Code, req.Purpose)

	// 返回成功响应（不包含验证码）
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":   "验证码已发送到您的邮箱",
		"expiresAt": verificationCode.ExpiresAt,
	})
}

// Register 用户注册
func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("解析注册请求失败: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "请求格式无效",
		})
		return
	}

	// 验证验证码
	if req.VerificationCode != "" {
		err = h.Model.VerifyCode(req.Email, req.VerificationCode, "registration")
		if err != nil {
			log.Printf("验证码验证失败: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"message": "验证码无效或已过期",
			})
			return
		}
	}

	// 创建新用户
	user := &models.User{
		Username:      req.Username,
		Password:      req.Password,
		Email:         req.Email,
		IsAdmin:       false,                      // 普通用户
		EmailVerified: req.VerificationCode != "", // 如果提供了验证码则标记为已验证
	}

	err = h.Model.CreateUser(user)
	if err != nil {
		log.Printf("创建用户失败: %v", err)
		if err.Error() == "username already exists" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]string{
				"message": "用户名已存在",
			})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "创建用户失败",
		})
		return
	}

	// 生成JWT令牌
	token, expiresAt, err := h.generateToken(user)
	if err != nil {
		log.Printf("生成令牌失败: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "生成令牌失败",
		})
		return
	}

	log.Printf("用户 %s 注册成功", req.Username)

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
