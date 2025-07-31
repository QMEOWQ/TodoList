module backend

go 1.24.3

replace github.com/TodoList/handlers => ./handlers

replace github.com/TodoList/models => ./models

replace github.com/TodoList/config => ./config

require (
	github.com/golang-jwt/jwt/v4 v4.5.2
	github.com/joho/godotenv v1.5.1
	github.com/lib/pq v1.10.9
	golang.org/x/crypto v0.40.0
)

require (
	github.com/TodoList/config v0.0.0-00010101000000-000000000000 // indirect
	github.com/TodoList/handlers v0.0.0-00010101000000-000000000000 // indirect
	github.com/TodoList/models v0.0.0-00010101000000-000000000000 // indirect
)
