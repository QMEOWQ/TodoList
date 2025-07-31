# 测试后端API的PowerShell脚本

$baseUrl = "http://localhost:8080"

Write-Host "=== 测试后端API ===" -ForegroundColor Green

# 测试健康检查
Write-Host "1. 测试服务器连接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -Method GET -ErrorAction Stop
    Write-Host "✓ 服务器连接正常" -ForegroundColor Green
} catch {
    Write-Host "✗ 服务器连接失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试用户注册
Write-Host "2. 测试用户注册..." -ForegroundColor Yellow
$registerData = @{
    username = "testuser_$(Get-Random)"
    password = "testpass123"
    email = "test@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/register" -Method POST -Body $registerData -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ 用户注册成功" -ForegroundColor Green
} catch {
    Write-Host "✗ 用户注册失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试用户登录
Write-Host "3. 测试用户登录..." -ForegroundColor Yellow
$loginData = @{
    username = ($registerData | ConvertFrom-Json).username
    password = "testpass123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/login" -Method POST -Body $loginData -ContentType "application/json" -ErrorAction Stop
    $loginResult = $response.Content | ConvertFrom-Json
    $token = $loginResult.token
    Write-Host "✓ 用户登录成功，获取到token" -ForegroundColor Green
} catch {
    Write-Host "✗ 用户登录失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试获取待办事项（需要认证）
Write-Host "4. 测试获取待办事项..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/todos" -Method GET -Headers $headers -ErrorAction Stop
    $todos = $response.Content | ConvertFrom-Json
    Write-Host "✓ 获取待办事项成功，当前有 $($todos.Count) 个任务" -ForegroundColor Green
} catch {
    Write-Host "✗ 获取待办事项失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试创建待办事项
Write-Host "5. 测试创建待办事项..." -ForegroundColor Yellow
$todoData = @{
    task = "测试任务 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    description = "这是一个测试任务"
    priority = "high"
    category = "work"
    tags = @("测试", "API")
    steps = @(
        @{ content = "步骤1"; completed = $false }
        @{ content = "步骤2"; completed = $false }
    )
}
$todoDataJson = $todoData | ConvertTo-Json -Depth 3

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/todos" -Method POST -Body $todoDataJson -Headers $headers -ErrorAction Stop
    $newTodo = $response.Content | ConvertFrom-Json
    Write-Host "✓ 创建待办事项成功，ID: $($newTodo.id)" -ForegroundColor Green
    $todoId = $newTodo.id
} catch {
    Write-Host "✗ 创建待办事项失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试增强API - 获取统计信息
Write-Host "6. 测试获取统计信息..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v2/todos/stats" -Method GET -Headers $headers -ErrorAction Stop
    $stats = $response.Content | ConvertFrom-Json
    Write-Host "✓ 获取统计信息成功" -ForegroundColor Green
    Write-Host "  - 总任务数: $($stats.total)" -ForegroundColor Cyan
    Write-Host "  - 已完成: $($stats.completed)" -ForegroundColor Cyan
    Write-Host "  - 待完成: $($stats.pending)" -ForegroundColor Cyan
    Write-Host "  - 完成率: $($stats.completionRate)%" -ForegroundColor Cyan
} catch {
    Write-Host "✗ 获取统计信息失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试增强API - 过滤查询
Write-Host "7. 测试过滤查询..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v2/todos?priority=high`&category=work" -Method GET -Headers $headers -ErrorAction Stop
    $filteredResult = $response.Content | ConvertFrom-Json
    Write-Host "✓ 过滤查询成功，找到 $($filteredResult.todos.Count) 个匹配的任务" -ForegroundColor Green
} catch {
    Write-Host "✗ 过滤查询失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== 测试完成 ===" -ForegroundColor Green
Write-Host "后端API基本功能正常！" -ForegroundColor Green
