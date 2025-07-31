package models

import (
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"math/big"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User 表示系统用户
type User struct {
	ID                    int        `json:"id"`
	Username              string     `json:"username"`
	Password              string     `json:"-"` // 不在json中返回密码
	Email                 string     `json:"email"`
	IsAdmin               bool       `json:"isAdmin"`
	CreateAt              time.Time  `json:"createAt"`
	EmailVerified         bool       `json:"emailVerified"`
	VerificationToken     *string    `json:"-"`
	VerificationExpiresAt *time.Time `json:"-"`
}

// UserResponse 要返回给客户端的信息
type UserResponse struct {
	ID            int       `json:"id"`
	Username      string    `json:"username"`
	Email         string    `json:"email"`
	IsAdmin       bool      `json:"isAdmin"`
	CreatedAt     time.Time `json:"createdAt"`
	EmailVerified bool      `json:"emailVerified"`
}

// ToResponse 将User转换为UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:            u.ID,
		Username:      u.Username,
		Email:         u.Email,
		IsAdmin:       u.IsAdmin,
		CreatedAt:     u.CreateAt,
		EmailVerified: u.EmailVerified,
	}
}

// VerificationCode 表示邮箱验证码
type VerificationCode struct {
	ID          int       `json:"id"`
	Email       string    `json:"email"`
	Code        string    `json:"code"`
	Purpose     string    `json:"purpose"`
	CreatedAt   time.Time `json:"createdAt"`
	ExpiresAt   time.Time `json:"expiresAt"`
	Used        bool      `json:"used"`
	Attempts    int       `json:"attempts"`
	MaxAttempts int       `json:"maxAttempts"`
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
		"INSERT INTO users (username, password, email, is_admin, created_at, email_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
		user.Username, string(hashedPassword), user.Email, user.IsAdmin, user.CreateAt, user.EmailVerified,
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
		"SELECT id, username, password, email, is_admin, created_at, email_verified FROM users WHERE username = $1",
		username,
	).Scan(
		&user.ID, &user.Username, &user.Password, &user.Email, &user.IsAdmin, &user.CreateAt, &user.EmailVerified,
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
		"SELECT id, username, email, is_admin, created_at, email_verified FROM users",
	)
	if err != nil {
		return nil, fmt.Errorf("admin, failed to query users: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var user UserResponse
		err := rows.Scan(
			&user.ID, &user.Username, &user.Email, &user.IsAdmin, &user.CreatedAt, &user.EmailVerified,
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
			Username:      "admin",
			Password:      "admin123", // 在实际应用中应使用更强的密码
			Email:         "admin@example.com",
			IsAdmin:       true,
			EmailVerified: true, // 管理员默认已验证
		}

		err = m.CreateUser(admin)
		if err != nil {
			return fmt.Errorf("create admin user failed: %w", err)
		}
		log.Println("Admin user created successfully")
	}

	// 检查是否存在test用户，如果不存在则创建
	var testExists bool
	err = m.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = 'test')").Scan(&testExists)
	if err != nil {
		log.Printf("检查test用户失败: %v", err)
	} else if !testExists {
		testUser := &User{
			Username:      "test",
			Password:      "password", // 简单密码便于测试
			Email:         "test@example.com",
			IsAdmin:       false,
			EmailVerified: true, // 测试用户默认已验证
		}

		err = m.CreateUser(testUser)
		if err != nil {
			log.Printf("创建test用户失败: %v", err)
		} else {
			log.Println("Test user created successfully")
		}
	}

	return nil
}

// GenerateVerificationCode 生成6位数字验证码
func (m *UserModel) GenerateVerificationCode(email, purpose string) (*VerificationCode, error) {
	// 生成6位随机数字验证码
	code := ""
	for i := 0; i < 6; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return nil, fmt.Errorf("generate random number failed: %w", err)
		}
		code += n.String()
	}

	// 设置过期时间为5分钟后
	expiresAt := time.Now().Add(5 * time.Minute)

	// 清理该邮箱的旧验证码
	_, err := m.DB.Exec(
		"DELETE FROM verification_codes WHERE email = $1 AND purpose = $2",
		email, purpose,
	)
	if err != nil {
		log.Printf("清理旧验证码失败: %v", err)
	}

	// 插入新验证码
	verificationCode := &VerificationCode{
		Email:       email,
		Code:        code,
		Purpose:     purpose,
		CreatedAt:   time.Now(),
		ExpiresAt:   expiresAt,
		Used:        false,
		Attempts:    0,
		MaxAttempts: 3,
	}

	err = m.DB.QueryRow(
		`INSERT INTO verification_codes (email, code, purpose, created_at, expires_at, used, attempts, max_attempts)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
		verificationCode.Email,
		verificationCode.Code,
		verificationCode.Purpose,
		verificationCode.CreatedAt,
		verificationCode.ExpiresAt,
		verificationCode.Used,
		verificationCode.Attempts,
		verificationCode.MaxAttempts,
	).Scan(&verificationCode.ID)

	if err != nil {
		return nil, fmt.Errorf("insert verification code failed: %w", err)
	}

	return verificationCode, nil
}

// VerifyCode 验证验证码
func (m *UserModel) VerifyCode(email, code, purpose string) error {
	var verificationCode VerificationCode

	// 查询验证码
	err := m.DB.QueryRow(
		`SELECT id, email, code, purpose, created_at, expires_at, used, attempts, max_attempts
		 FROM verification_codes
		 WHERE email = $1 AND purpose = $2 AND used = FALSE
		 ORDER BY created_at DESC LIMIT 1`,
		email, purpose,
	).Scan(
		&verificationCode.ID,
		&verificationCode.Email,
		&verificationCode.Code,
		&verificationCode.Purpose,
		&verificationCode.CreatedAt,
		&verificationCode.ExpiresAt,
		&verificationCode.Used,
		&verificationCode.Attempts,
		&verificationCode.MaxAttempts,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("verification code not found or expired")
		}
		return fmt.Errorf("query verification code failed: %w", err)
	}

	// 检查是否过期
	if time.Now().After(verificationCode.ExpiresAt) {
		return fmt.Errorf("verification code expired")
	}

	// 检查尝试次数
	if verificationCode.Attempts >= verificationCode.MaxAttempts {
		return fmt.Errorf("verification code attempts exceeded")
	}

	// 增加尝试次数
	_, err = m.DB.Exec(
		"UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1",
		verificationCode.ID,
	)
	if err != nil {
		log.Printf("更新验证码尝试次数失败: %v", err)
	}

	// 验证码码
	if verificationCode.Code != code {
		return fmt.Errorf("invalid verification code")
	}

	// 标记为已使用
	_, err = m.DB.Exec(
		"UPDATE verification_codes SET used = TRUE WHERE id = $1",
		verificationCode.ID,
	)
	if err != nil {
		log.Printf("标记验证码为已使用失败: %v", err)
	}

	return nil
}
