module github.com/TodoList/handlers

go 1.24.3

replace github.com/TodoList/models => ../models

require (
	github.com/TodoList/models v0.0.0-00010101000000-000000000000
	github.com/golang-jwt/jwt/v4 v4.5.2
)

require golang.org/x/crypto v0.40.0 // indirect
