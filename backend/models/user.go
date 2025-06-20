package models

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User 表示系统用户
type User struct {
	ID       int       `json:"id"`
	Username string    `json:"username"`
	Password string    `json:"-"` // 不在json中返回密码
	Email    string    `json:"email"`
	IsAdmin  bool      `json:"isAdmin"`
	CreateAt time.Time `json:"createAt"`
}

// UserResponse 要返回给客户端的信息
type UserResponse struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	IsAdmin   bool      `json:"isAdmin"`
	CreatedAt time.Time `json:"createdAt"`
}

// ToResponse 将User转换为UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Username:  u.Username,
		Email:     u.Email,
		IsAdmin:   u.IsAdmin,
		CreatedAt: u.CreateAt,
	}
}

type UserModel struct {
	DB *sql.DB
}

// NewUserModel 创建一个新的UserModel实例
func NewUserModel(db *sql.DB) *UserModel {
	return &UserModel{DB: db}
}

// CreateUser 创建一个新用户
func (m *UserModel) CreateUser(user *User) error {
	// 检查用户名是否存在
	var exists bool
	err := m.DB.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", user.Username,
	).Scan(&exists)
	if err != nil {
		return fmt.Errorf("check username failed: %w", err)
	}
	if exists {
		return fmt.Errorf("username already exists")
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// 插入用户记录
	user.CreateAt = time.Now()
	err = m.DB.QueryRow(
		"INSERT INTO users (username, password, email, is_admin, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id",
		user.Username, string(hashedPassword), user.Email, user.IsAdmin, user.CreateAt,
	).Scan(&user.ID)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetUserByUsername 根据用户名获取用户
func (m *UserModel) GetUserByUsername(username string) (*User, error) {
	var user User

	err := m.DB.QueryRow(
		"SELECT id, username, password, email, is_admin, created_at FROM users WHERE username = $1",
		username,
	).Scan(
		&user.ID, &user.Username, &user.Password, &user.Email, &user.IsAdmin, &user.CreateAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// GetAllUsers 获取所有用户（仅管理员可用）
func (m *UserModel) GetAllUsers() ([]UserResponse, error) {
	var users []UserResponse

	rows, err := m.DB.Query(
		"SELECT id, username, email, is_admin, created_at FROM users",
	)
	if err != nil {
		return nil, fmt.Errorf("admin, failed to query users: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var user UserResponse
		err := rows.Scan(
			&user.ID, &user.Username, &user.Email, &user.IsAdmin, &user.CreatedAt,
		)
		if err != nil {
			log.Printf("scan user failed: %v", err)
			continue
		}
		users = append(users, user)
	}

	return users, nil
}

// VerifyPassword 验证用户密码
func (m *UserModel) VerifyPassword(username, password string) (*User, error) {
	user, err := m.GetUserByUsername(username)
	if err != nil {
		return nil, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, fmt.Errorf("invalid password")
	}

	return user, nil
}

// InitAdminUser 初始化管理员用户
func (m *UserModel) InitAdminUser() error {
	// 检查是否已存在管理员用户
	var count int
	err := m.DB.QueryRow("SELECT COUNT(*) FROM users WHERE is_admin = true").Scan(&count)
	if err != nil {
		return fmt.Errorf("check admin users failed: %w", err)
	}

	// 如果没有管理员用户，创建一个
	if count == 0 {
		admin := &User{
			Username: "admin",
			Password: "admin123", // 在实际应用中应使用更强的密码
			Email:    "admin@example.com",
			IsAdmin:  true,
			// Username: "test1",
			// Password: "test1passwd", // 在实际应用中应使用更强的密码
			// Email:    test1@example.com",
			// IsAdmin:  false,
		}

		err = m.CreateUser(admin)
		if err != nil {
			return fmt.Errorf("create admin user failed: %w", err)
		}
		log.Println("Admin user created successfully")
	}

	return nil
}
