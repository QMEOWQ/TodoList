import React, { useEffect, useState } from "react";
import Login from './components/Login/Login';
import "./App.css";

function App() {
  const [todos, setTodos] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editingTaskSteps, setEditingTaskSteps] = useState([]);
  const [currentTaskSteps, setCurrentTaskSteps] = useState([]);
  const [newStep, setNewStep] = useState("");
  const [expandedTasks, setExpandedTasks] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 添加这些新的状态变量
  const [editingTodo, setEditingTodo] = useState(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskDesc, setEditTaskDesc] = useState("");
  const [editTaskSteps, setEditTaskSteps] = useState([]);
  const [updatingTodo, setUpdatingTodo] = useState(false);
  
  // Toggle expand/collapse for a specific task
  const toggleTaskExpand = (todoId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [todoId]: !prev[todoId]
    }));
  };
  
  // Toggle expand/collapse for all tasks
  const toggleAllExpanded = () => {
    if (allExpanded) {
      // If all are expanded, collapse all
      setExpandedTasks({});
    } else {
      // If not all expanded, expand all
      const expandAll = {};
      todos.forEach(todo => {
        expandAll[todo.id] = true;
      });
      setExpandedTasks(expandAll);
    }
    setAllExpanded(!allExpanded);
  };
  
  // 用户认证状态
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  
  // 管理员面板状态 - 移到组件顶部
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTodos, setUserTodos] = useState([]);

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
        setUsers(data);
      }
    } catch (error) {
      console.error("获取用户列表失败:", error);
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
    setUserTodos(todos);
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
      setTodos(data);
    } catch (error) {
      console.error('获取任务列表失败:', error);
      alert(`获取任务列表失败: ${error.message}`);
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    }
  }, [isAuthenticated, fetchTodos]);

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
  };

  // 添加步骤
  const addStep = () => {
    if (newStep.trim()) {
      setCurrentTaskSteps([...currentTaskSteps, { content: newStep.trim(), completed: false }]);
      setNewStep("");
    }
  };

  // 删除步骤
  const removeStep = (index) => {
    const newSteps = [...currentTaskSteps];
    newSteps.splice(index, 1);
    setCurrentTaskSteps(newSteps);
  };

  // 提交新任务
  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const newTodo = {
        task: taskName,
        description: taskDesc,
        steps: currentTaskSteps
      };
      
      const response = await fetch('http://localhost:8080/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTodo)
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
      
      // 直接更新本地状态，而不是重新获取整个列表
      setTodos(prevTodos => [addedTodo, ...prevTodos]);
      
      // 重置表单
      setTaskName('');
      setTaskDesc('');
      setCurrentTaskSteps([]);
      
      // 可选：展开新添加的任务
      setExpandedTasks(prev => ({
        ...prev,
        [addedTodo.id]: true
      }));
      
    } catch (error) {
      console.error('添加任务失败:', error);
      alert(`添加任务失败: ${error.message}`);
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
    } catch (error) {
      console.error("切换任务状态失败:", error);
    }
  };

  // 删除任务
  const deleteTodo = async (todoId) => {
    if (!window.confirm('确定要删除这个任务吗？')) return;
    
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
    } catch (error) {
      console.error("删除任务失败:", error);
    }
  };

  // 开始编辑任务
  const startEditTodo = (todo) => {
    setEditingTodo(todo.id);
    setEditTaskName(todo.task);
    setEditTaskDesc(todo.description || "");
    setEditTaskSteps(todo.steps ? [...todo.steps] : []);
  };

  // 取消编辑任务
  const cancelEditTodo = () => {
    setEditingTodo(null);
    setEditTaskName("");
    setEditTaskDesc("");
    setEditTaskSteps([]);
  };

  // 添加编辑中的步骤
  const addEditStep = () => {
    if (newStep.trim()) {
      setEditTaskSteps([...editTaskSteps, { content: newStep.trim(), completed: false }]);
      setNewStep("");
    }
  };

  // 删除编辑中的步骤
  const removeEditStep = (index) => {
    const newSteps = [...editTaskSteps];
    newSteps.splice(index, 1);
    setEditTaskSteps(newSteps);
  };

  // 更新任务
  const handleUpdateTodo = async (todoId) => {
    if (!editTaskName.trim()) return;
    
    setUpdatingTodo(true);
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const updatedTodo = {
        id: todoId,
        task: editTaskName,
        description: editTaskDesc,
        steps: editTaskSteps
      };
      
      const response = await fetch(`http://localhost:8080/api/todos/${todoId}`, {
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
        todo.id === todoId ? updatedTodoData : todo
      ));
      
      // 重置编辑状态
      cancelEditTodo();
      
    } catch (error) {
      console.error('更新任务失败:', error);
      alert(`更新任务失败: ${error.message}`);
    } finally {
      setUpdatingTodo(false);
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
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">任务列表</h1>
        <div className="user-info">
          <span>欢迎，{user.username}</span>
          {user.isAdmin && <span className="admin-badge">管理员</span>}
          <button className="logout-button" onClick={handleLogout}>登出</button>
        </div>
      </div>

      {/* 管理员面板 */}
      {user.isAdmin && (
        <div className="admin-panel">
          <h2>用户管理</h2>
          <div className="users-list">
            {users.length === 0 ? (
              <p>暂无用户数据</p>
            ) : (
              users.map(userData => (
                <div key={userData.id} className="user-item">
                  <div className="user-details">
                    <span className="user-name">{userData.username}</span>
                    <span className="user-email">{userData.email}</span>
                    {userData.isAdmin && <span className="admin-badge">管理员</span>}
                    <button 
                      className="view-todos-button"
                      onClick={() => handleUserSelect(userData.id)}
                    >
                      {selectedUser === userData.id ? '隐藏待办事项' : '查看待办事项'}
                    </button>
                  </div>
                  
                  {selectedUser === userData.id && (
                    <div className="user-todos">
                      <h3>{userData.username}的待办事项</h3>
                      {userTodos.length === 0 ? (
                        <p>该用户暂无待办事项</p>
                      ) : (
                        <div className="todos-list">
                          {userTodos.map(todo => (
                            <div key={todo.id} className={`user-todo-item ${todo.done ? 'done' : ''}`}>
                              <div className="todo-header">
                                <div className="todo-title">
                                  <input
                                    type="checkbox"
                                    checked={todo.done}
                                    disabled
                                  />
                                  <div>
                                    <h4>{todo.task}</h4>
                                    {todo.createdAt && (
                                      <div className="todo-time">
                                        创建于: {formatTime(todo.createdAt)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {todo.description && <p className="todo-description">{todo.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 添加任务表单 */}
      <div className="add-task-form">
        <h2>添加新任务</h2>
        <div className="form-group">
          <input
            type="text"
            placeholder="任务名称"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitTask()}
          />
        </div>
        <div className="form-group">
          <textarea
            placeholder="任务描述（可选）"
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
          ></textarea>
        </div>
        <div className="steps-container">
          <h3>步骤</h3>
          {currentTaskSteps.map((step, index) => (
            <div key={index} className="step-item">
              <span>{step.content}</span>
              <button onClick={() => removeStep(index)}>删除</button>
            </div>
          ))}
          <div className="add-step">
            <input
              type="text"
              placeholder="新步骤"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addStep()}
            />
            <button onClick={addStep}>添加步骤</button>
          </div>
        </div>
        <button
          className="add-task-button"
          onClick={handleSubmitTask}
          disabled={!taskName.trim() || submitting}
        >
          {submitting ? '提交中...' : '添加任务'}
        </button>
      </div>

      {/* 任务列表 */}
      <div className="todos-container">
        <div className="todos-header">
          <h2 className="todos-title">我的任务</h2>
          <button 
            className="expand-all-button"
            onClick={toggleAllExpanded}
          >
            {allExpanded ? "全部收起" : "全部展开"}
          </button>
        </div>
        
        {loading ? (
          <div className="loading-message">加载中...</div>
        ) : todos.length === 0 ? (
          <div className="no-todos-message">暂无任务，快来添加第一个任务吧！</div>
        ) : (
          todos.map(todo => (
            <div key={todo.id} className="todo-item">
              <div className="todo-header" onClick={() => toggleTaskExpand(todo.id)}>
                <div className="todo-header-left">
                  <input
                    type="checkbox"
                    className="todo-checkbox"
                    checked={todo.done}
                    onChange={() => toggleTodo(todo.id)}
                    onClick={e => e.stopPropagation()}
                  />
                  <div>
                    <h3 className={`todo-title ${todo.done ? 'done' : ''}`}>{todo.task}</h3>
                    <span className="todo-time">{formatTime(todo.createdAt)}</span>
                  </div>
                </div>

                <div className="todo-header-right">
                  <button 
                    className="todo-button update"
                    onClick={e => {
                      e.stopPropagation();
                      startEditTodo(todo);
                    }}
                  >
                    更新
                  </button>
                  <button 
                    className="todo-button expand"
                    onClick={e => {
                      e.stopPropagation();
                      toggleTaskExpand(todo.id);
                    }}
                  >
                    {expandedTasks[todo.id] ? "收起" : "展开"}
                  </button>
                  <button 
                    className="todo-button delete"
                    onClick={e => {
                      e.stopPropagation();
                      deleteTodo(todo.id);
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>

              <div 
                id={`todo-details-${todo.id}`}
                className={`todo-details ${expandedTasks[todo.id] ? 'expanded' : ''}`}
              >
                {editingTodo === todo.id ? (
                  <div className="edit-todo-form">
                    <h4>编辑任务</h4>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="任务名称"
                        value={editTaskName}
                        onChange={(e) => setEditTaskName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        placeholder="任务描述（可选）"
                        value={editTaskDesc}
                        onChange={(e) => setEditTaskDesc(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="steps-container">
                      <h4>步骤</h4>
                      {editTaskSteps.map((step, index) => (
                        <div key={index} className="step-item">
                          <span>{step.content}</span>
                          <button onClick={() => removeEditStep(index)}>删除</button>
                        </div>
                      ))}
                      <div className="add-step">
                        <input
                          type="text"
                          placeholder="新步骤"
                          value={newStep}
                          onChange={(e) => setNewStep(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addEditStep()}
                        />
                        <button onClick={addEditStep}>添加步骤</button>
                      </div>
                    </div>
                    <div className="edit-buttons">
                      <button
                        className="update-task-button"
                        onClick={() => handleUpdateTodo(todo.id)}
                        disabled={!editTaskName.trim() || updatingTodo}
                      >
                        {updatingTodo ? '更新中...' : '保存更新'}
                      </button>
                      <button
                        className="cancel-edit-button"
                        onClick={cancelEditTodo}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {todo.description && (
                      <div className="todo-description">{todo.description}</div>
                    )}
                    
                    {todo.steps && todo.steps.length > 0 && (
                      <div>
                        <h4 className="todo-steps-title">步骤：</h4>
                        {todo.steps.map(step => (
                          <div key={step.id} className="todo-step">
                            <input
                              type="checkbox"
                              className="step-checkbox"
                              checked={step.completed}
                              onChange={() => toggleStep(step.id)}
                            />
                            <span className={`step-content ${step.completed ? 'done' : ''}`}>
                              {step.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} // App 函数结束

export default App;
