# 简单的API测试
$baseUrl = "http://localhost:8080"

Write-Host "Testing server connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method GET -ErrorAction Stop
    Write-Host "Server is running!" -ForegroundColor Green
} catch {
    Write-Host "Server connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Testing user registration..." -ForegroundColor Yellow
$registerData = '{"username":"testuser123","password":"testpass123","email":"test@example.com"}'

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/register" -Method POST -Body $registerData -ContentType "application/json" -ErrorAction Stop
    Write-Host "User registration successful!" -ForegroundColor Green
} catch {
    Write-Host "User registration failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing user login..." -ForegroundColor Yellow
$loginData = '{"username":"testuser123","password":"testpass123"}'

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/login" -Method POST -Body $loginData -ContentType "application/json" -ErrorAction Stop
    $loginResult = $response.Content | ConvertFrom-Json
    $token = $loginResult.token
    Write-Host "User login successful! Token obtained." -ForegroundColor Green
} catch {
    Write-Host "User login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Testing get todos..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/todos" -Method GET -Headers $headers -ErrorAction Stop
    $todos = $response.Content | ConvertFrom-Json
    Write-Host "Get todos successful! Found $($todos.Count) todos." -ForegroundColor Green
} catch {
    Write-Host "Get todos failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing create todo..." -ForegroundColor Yellow
$todoData = '{"task":"Test Task","description":"Test Description","priority":"high","category":"work"}'

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/todos" -Method POST -Body $todoData -Headers $headers -ErrorAction Stop
    $newTodo = $response.Content | ConvertFrom-Json
    Write-Host "Create todo successful! ID: $($newTodo.id)" -ForegroundColor Green
} catch {
    Write-Host "Create todo failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "All tests completed!" -ForegroundColor Green
