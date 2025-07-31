import React, { useEffect, useState } from "react";
import Login from './components/Login/Login';
import MainLayout from './components/Layout/MainLayout';
import TaskForm from './components/TaskForm/TaskForm';
import TaskListEnhanced from './components/TaskList/TaskListEnhanced';
import AdminPanel from './components/Admin/AdminPanel';
import "./App.css";
import { message, Modal } from 'antd';



function App() {
  // 基础状态
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 用户认证状态
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 管理员相关状态
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTodos, setUserTodos] = useState([]);

  // 任务表单状态（用于重置）
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [currentTaskSteps, setCurrentTaskSteps] = useState([]);

  // 任务列表展开状态
  const [expandedTasks, setExpandedTasks] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);


  
  // 检查用户是否已登录
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      
      // 如果是管理员，获取所有用户
      if (JSON.parse(storedUser).isAdmin) {
        fetchUsers(token);
      }
    }
  }, []);

  // 获取所有用户（仅管理员）
  const fetchUsers = async (token) => {
    try {
      const res = await fetch("http://localhost:8080/api/users", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (error) {
      console.error("获取用户列表失败:", error);
      message.error("获取用户列表失败");
    }
  };

  // 管理员获取用户待办事项 - 移到组件顶部
  const fetchUserTodos = async (userId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/admin/user-todos/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("获取用户待办事项失败:", error);
      message.error("获取用户待办事项失败");
      return [];
    }
  };
  
  // 处理用户选择 - 移到组件顶部
  const handleUserSelect = async (userId) => {
    if (selectedUser === userId) {
      setSelectedUser(null);
      setUserTodos([]);
      return;
    }
    
    setSelectedUser(userId);
    const todos = await fetchUserTodos(userId);
    setUserTodos(todos || []);
  };

  const fetchTodos = async () => {
    // 不要立即设置loading为true，这会导致页面抖动
    // 只有当请求时间超过一定阈值时才显示加载状态
    let loadingTimeout;
    
    try {
      loadingTimeout = setTimeout(() => {
        setLoading(true);
      }, 300); // 300ms延迟显示加载状态
      
      // 修改这里：从相对路径改为完整的后端URL
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/todos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('服务器返回非JSON响应:', text);
        throw new Error('服务器返回了非JSON格式的响应');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '获取任务列表失败');
      }
      
      const data = await response.json();
      setTodos(data || []);
    } catch (error) {
      console.error('获取任务列表失败:', error);
      message.error(`获取任务列表失败: ${error.message}`);
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    }
  }, [isAuthenticated]);

  // 处理登录成功
  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    // 如果是管理员，获取所有用户
    if (userData.isAdmin) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      fetchUsers(token);
    }
  };

  // 处理注册成功
  const handleRegister = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  // 处理登出
  const handleLogout = () => {
    // 取消所有正在进行的请求
    setLoading(false); // 停止加载状态
    setSubmitting(false); // 停止提交状态
    
    // 清除存储的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // 重置状态
    setTodos([]);
    setUser(null);
    setIsAuthenticated(false);
    setUsers([]);
    setTaskName('');
    setTaskDesc('');
    setCurrentTaskSteps([]);
    setExpandedTasks({});
    setAllExpanded(false);
    
    message.success("已成功登出");
  };

  // 提交新任务
  const handleSubmitTask = async (taskData) => {
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch('http://localhost:8080/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('服务器返回非JSON响应:', text);
        throw new Error('服务器返回了非JSON格式的响应');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '添加任务失败');
      }

      const addedTodo = await response.json();

      // 直接更新本地状态
      setTodos(prevTodos => [addedTodo, ...prevTodos]);

      message.success("任务添加成功");
      return true;
    } catch (error) {
      console.error('添加任务失败:', error);
      message.error(`添加任务失败: ${error.message}`);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // 切换任务完成状态
  const toggleTodo = async (todoId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch("http://localhost:8080/api/toggle", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: todoId })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      await fetchTodos();
      message.success("任务状态已更新");
    } catch (error) {
      console.error("切换任务状态失败:", error);
      message.error("切换任务状态失败");
    }
  };

  // 删除任务
  const deleteTodo = async (todoId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const res = await fetch(`http://localhost:8080/api/todos/${todoId}`, {
            method: "DELETE",
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          
          await fetchTodos();
          message.success("任务已删除");
        } catch (error) {
          console.error("删除任务失败:", error);
          message.error("删除任务失败");
        }
      }
    });
  };

  // 更新任务
  const handleUpdateTodo = async (updatedTodo) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`http://localhost:8080/api/todos/${updatedTodo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTodo)
      });

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('服务器返回非JSON响应:', text);
        throw new Error('服务器返回了非JSON格式的响应');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新任务失败');
      }

      const updatedTodoData = await response.json();

      // 更新本地状态
      setTodos(prevTodos => prevTodos.map(todo =>
        todo.id === updatedTodo.id ? updatedTodoData : todo
      ));

      message.success("任务已更新");
      return true;
    } catch (error) {
      console.error('更新任务失败:', error);
      message.error(`更新任务失败: ${error.message}`);
      return false;
    }
  };

  // 切换步骤完成状态
  const toggleStep = async (stepId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch("http://localhost:8080/api/toggle-step", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: stepId })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      await fetchTodos();
    } catch (error) {
      console.error("切换步骤状态失败:", error);
      message.error("切换步骤状态失败");
    }
  };

  // 格式化时间
  const formatTime = (timeString) => {
    if (!timeString) return '未知时间';
    
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '时间格式错误';
      
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('时间格式化错误:', error);
      return '时间格式错误';
    }
  };

  // 如果未登录，显示登录界面
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <MainLayout user={user} onLogout={handleLogout}>
      {/* 管理员面板 */}
      {user?.isAdmin && (
        <AdminPanel
          users={users}
          onUserSelect={handleUserSelect}
          selectedUser={selectedUser}
          userTodos={userTodos}
        />
      )}

      {/* 添加任务表单 */}
      <TaskForm
        onSubmit={handleSubmitTask}
        loading={submitting}
      />

      {/* 任务列表 */}
      <TaskListEnhanced
        todos={todos}
        loading={loading}
        onToggleTodo={toggleTodo}
        onDeleteTodo={deleteTodo}
        onUpdateTodo={handleUpdateTodo}
        onToggleStep={toggleStep}
      />
    </MainLayout>
  );
}

export default App;
