import React, { useEffect, useState } from "react";
import Login from './components/Login/Login';
import "./App.css";
import { Layout, Menu, Button, Input, Checkbox, Card, List, Typography, Divider, Collapse, Form, Space, Tag, Spin, Empty, Tabs, Modal, message } from 'antd';
import { CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined, LogoutOutlined, DownOutlined, UpOutlined, UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import TaskList from './components/TaskList/TaskList';

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

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
  
  // 把导致错误的 hooks 移动到这里
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 

  // 用户认证状态
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  
  // 管理员面板状态 - 移到组件顶部
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTodos, setUserTodos] = useState([]);

  // 切换任务完成状态
  const handleToggleComplete = (taskId) => {
    setTodos(todos.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // 删除任务
  const handleDeleteTask = (taskId) => {
    setTodos(todos.filter(task => task.id !== taskId));
  };

  // 切换任务展开状态
  const handleToggleExpand = (taskId) => {
    // 这里可以添加展开/折叠逻辑，如果需要的话
    console.log(`Toggle expand for task ${taskId}`);
  };
  
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
    if (e) e.preventDefault();
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
      
      message.success("任务添加成功");
    } catch (error) {
      console.error('添加任务失败:', error);
      message.error(`添加任务失败: ${error.message}`);
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

  // 新增：处理编辑中步骤内容的变更
  const handleEditStepChange = (index, newContent) => {
    const updatedSteps = [...editTaskSteps];
    updatedSteps[index].content = newContent;
    setEditTaskSteps(updatedSteps);
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
      message.success("任务已更新");
    } catch (error) {
      console.error('更新任务失败:', error);
      message.error(`更新任务失败: ${error.message}`);
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
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>任务列表</Title>
        {user ? (
          <Space>
            <Text style={{ color: 'white' }}>欢迎, {user.username}</Text>
            {user.isAdmin && <Tag color="gold">管理员</Tag>}
            <Button type="primary" danger onClick={handleLogout}>
              登出
            </Button>
          </Space>
        ) : (
          <Space>
            <Button type="primary" onClick={() => { setAuthMode('login'); setIsModalVisible(true); }}>登录</Button>
            <Button onClick={() => { setAuthMode('register'); setIsModalVisible(true); }}>注册</Button>
          </Space>
        )}
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 24 }}>
        {/* 管理员面板 */}
        {user.isAdmin && (
          <Card title="用户管理" className="admin-panel" style={{ marginBottom: 20 }}>
            {users.length === 0 ? (
              <Empty description="暂无用户数据" />
            ) : (
              <List
                dataSource={users}
                renderItem={userData => (
                  <List.Item
                    actions={[
                      <Button 
                        type="primary"
                        onClick={() => handleUserSelect(userData.id)}
                      >
                        {selectedUser === userData.id ? '隐藏待办事项' : '查看待办事项'}
                      </Button>
                    ]}
                  >
                    <div style={{ width: '100%' }}>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{userData.username}</Text>
                            {userData.isAdmin && <Tag color="gold">管理员</Tag>}
                          </Space>
                        }
                      />
                      
                      {selectedUser === userData.id && (
                        <div className="user-todos" style={{ marginTop: 16, width: '100%' }}>
                          <Divider orientation="left">{userData.username}的待办事项</Divider>
                          {userTodos.length === 0 ? (
                            <Empty description="该用户暂无待办事项" />
                          ) : (
                            <List
                              dataSource={userTodos}
                              renderItem={todo => (
                                <List.Item>
                                  <List.Item.Meta
                                    avatar={<Checkbox checked={todo.done} disabled />}
                                    title={<Text delete={todo.done}>{todo.task}</Text>}
                                    description={
                                      <Space direction="vertical" size={0}>
                                        {todo.description && <Text type="secondary">{todo.description}</Text>}
                                        {todo.createdAt && (
                                          <Text type="secondary" style={{ fontSize: '12px' }}>创建于: {formatTime(todo.createdAt)}</Text>
                                        )}
                                      </Space>
                                    }
                                  />
                                </List.Item>
                              )}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        )}

        {/* 添加任务表单 */}
        <Card title="添加新任务" className="add-task-form" style={{ marginBottom: 20 }}>
          <Form layout="vertical">
            <Form.Item label="任务名称" required>
              <Input 
                placeholder="任务名称" 
                value={taskName} 
                onChange={(e) => setTaskName(e.target.value)} 
                onPressEnter={handleSubmitTask}
              />
            </Form.Item>
            
            <Form.Item label="任务描述">
              <TextArea 
                placeholder="任务描述（可选）" 
                value={taskDesc} 
                onChange={(e) => setTaskDesc(e.target.value)} 
                autoSize={{ minRows: 2 }}
              />
            </Form.Item>
            
            <Form.Item label="步骤">
              <List
                dataSource={currentTaskSteps}
                renderItem={(step, index) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => removeStep(index)}
                      />
                    ]}
                  >
                    {step.content}
                  </List.Item>
                )}
                footer={
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input 
                      placeholder="新步骤" 
                      value={newStep} 
                      onChange={(e) => setNewStep(e.target.value)} 
                      onPressEnter={addStep}
                    />
                    <Button type="primary" onClick={addStep} icon={<PlusOutlined />}>添加步骤</Button>
                  </div>
                }
              />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                onClick={handleSubmitTask} 
                disabled={!taskName.trim() || submitting}
                loading={submitting}
                icon={<PlusOutlined />}
                block
              >
                添加任务
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 任务列表 */}
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>我的任务</span>
              <Button 
                type="primary" 
                onClick={toggleAllExpanded}
                icon={allExpanded ? <UpOutlined /> : <DownOutlined />}
              >
                {allExpanded ? "全部收起" : "全部展开"}
              </Button>
            </div>
          } 
          className="todos-container"
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
            </div>
          ) : todos.length === 0 ? (
            <Empty description="暂无任务，快来添加第一个任务吧！" />
          ) : (
            <List
              dataSource={todos}
              renderItem={todo => (
                <List.Item
                  key={todo.id}
                  className="todo-item"
                  actions={[
                    <Button 
                      type="primary" 
                      ghost 
                      icon={<EditOutlined />} 
                      onClick={() => startEditTodo(todo)}
                    >
                      更新
                    </Button>,
                    <Button 
                      type="primary" 
                      ghost 
                      icon={expandedTasks[todo.id] ? <UpOutlined /> : <DownOutlined />} 
                      onClick={() => toggleTaskExpand(todo.id)}
                    >
                      {expandedTasks[todo.id] ? "收起" : "展开"}
                    </Button>,
                    <Button 
                      type="primary" 
                      danger 
                      ghost 
                      icon={<DeleteOutlined />} 
                      onClick={() => deleteTodo(todo.id)}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <List.Item.Meta
                      avatar={
                        <Checkbox 
                          checked={todo.done} 
                          onChange={() => toggleTodo(todo.id)}
                        />
                      }
                      title={
                        <Text delete={todo.done} strong>
                          {todo.task}
                        </Text>
                      }
                      description={
                        <Text type="secondary">
                          {formatTime(todo.createdAt)}
                        </Text>
                      }
                    />
                    
                    {expandedTasks[todo.id] && (
                      <div className="todo-details" style={{ marginTop: 16, width: '100%' }}>
                        {editingTodo === todo.id ? (
                          <Form layout="vertical">
                            <Form.Item label="任务名称" required>
                              <Input 
                                value={editTaskName} 
                                onChange={(e) => setEditTaskName(e.target.value)} 
                              />
                            </Form.Item>
                            
                            <Form.Item label="任务描述">
                              <TextArea 
                                value={editTaskDesc} 
                                onChange={(e) => setEditTaskDesc(e.target.value)} 
                                autoSize={{ minRows: 2 }}
                              />
                            </Form.Item>
                            
                            <Form.Item label="步骤">
                              <List
                                dataSource={editTaskSteps}
                                renderItem={(step, index) => (
                                  <List.Item
                                    actions={[
                                      <Button 
                                        type="text" 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        onClick={() => removeEditStep(index)}
                                      />
                                    ]}
                                  >
                                    <Input
                                      value={step.content}
                                      onChange={(e) => handleEditStepChange(index, e.target.value)}
                                    />
                                  </List.Item>
                                )}
                                footer={
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <Input 
                                      placeholder="新步骤" 
                                      value={newStep} 
                                      onChange={(e) => setNewStep(e.target.value)} 
                                      onPressEnter={addEditStep}
                                    />
                                    <Button type="primary" onClick={addEditStep} icon={<PlusOutlined />}>添加步骤</Button>
                                  </div>
                                }
                              />
                            </Form.Item>
                            
                            <Form.Item>
                              <Space>
                                <Button 
                                  type="primary" 
                                  onClick={() => handleUpdateTodo(todo.id)} 
                                  disabled={!editTaskName.trim() || updatingTodo}
                                  loading={updatingTodo}
                                >
                                  保存更新
                                </Button>
                                <Button onClick={cancelEditTodo}>取消</Button>
                              </Space>
                            </Form.Item>
                          </Form>
                        ) : (
                          <>
                            {todo.description && (
                              <Paragraph>{todo.description}</Paragraph>
                            )}
                            
                            {todo.steps && todo.steps.length > 0 && (
                              <div>
                                <Divider orientation="left">步骤</Divider>
                                <List
                                  dataSource={todo.steps}
                                  renderItem={step => (
                                    <List.Item>
                                      <Checkbox 
                                        checked={step.completed} 
                                        onChange={() => toggleStep(step.id)}
                                      />
                                      <span style={{ 
                                        marginLeft: 8, 
                                        textDecoration: step.completed ? 'line-through' : 'none',
                                        color: step.completed ? '#8c8c8c' : 'inherit'
                                      }}>
                                        {step.content}
                                      </span>
                                    </List.Item>
                                  )}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>
      </Content>
    </Layout>
  );
}

export default App;
