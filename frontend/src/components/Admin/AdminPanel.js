import React, { useState } from 'react';
import { Card, List, Button, Empty, Typography, Space, Tag, Divider, Checkbox, Collapse } from 'antd';
import { UserOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import './AdminPanel.css';

const { Text } = Typography;
const { Panel } = Collapse;

const AdminPanel = ({ users, onUserSelect, selectedUser, userTodos }) => {
  const [expandedUsers, setExpandedUsers] = useState({});

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

  // 切换用户展开状态
  const toggleUserExpand = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
    onUserSelect(userId);
  };

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <span>用户管理</span>
          <Tag color="blue">{users.length} 个用户</Tag>
        </Space>
      }
      className="admin-panel-card"
    >
      {users.length === 0 ? (
        <Empty
          description="暂无用户数据"
          className="empty-users"
        />
      ) : (
        <Collapse
          className="users-collapse"
          ghost
          expandIcon={({ isActive }) =>
            isActive ? <EyeInvisibleOutlined /> : <EyeOutlined />
          }
          onChange={(activeKeys) => {
            // 处理折叠面板变化
            const newExpandedUsers = {};
            activeKeys.forEach(key => {
              newExpandedUsers[key] = true;
              if (!expandedUsers[key]) {
                onUserSelect(parseInt(key));
              }
            });
            setExpandedUsers(newExpandedUsers);
          }}
        >
          {users.map(userData => (
            <Panel
              key={userData.id}
              header={
                <div className="user-header">
                  <Space>
                    <div className="user-avatar">
                      {userData.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <Text strong className="username">
                        {userData.username}
                      </Text>
                      {userData.isAdmin && (
                        <Tag color="gold" size="small">管理员</Tag>
                      )}
                    </div>
                  </Space>
                  <Tag color="blue" className="todo-count">
                    {selectedUser === userData.id ? userTodos.length : '?'} 个任务
                  </Tag>
                </div>
              }
              className="user-panel"
            >
              <div className="user-todos-container">
                {selectedUser === userData.id ? (
                  userTodos.length === 0 ? (
                    <Empty
                      description="该用户暂无待办事项"
                      size="small"
                      className="empty-todos"
                    />
                  ) : (
                    <List
                      className="user-todos-list"
                      dataSource={userTodos}
                      renderItem={todo => (
                        <List.Item className="user-todo-item">
                          <div className="todo-content">
                            <div className="todo-main">
                              <Checkbox
                                checked={todo.done}
                                disabled
                                className="todo-checkbox"
                              />
                              <div className="todo-info">
                                <Text
                                  delete={todo.done}
                                  strong
                                  className="todo-title"
                                >
                                  {todo.task}
                                </Text>
                                {todo.description && (
                                  <Text
                                    type="secondary"
                                    className="todo-description"
                                  >
                                    {todo.description}
                                  </Text>
                                )}
                              </div>
                            </div>

                            <div className="todo-meta">
                              <Space size="small">
                                <Tag color={todo.done ? "success" : "processing"}>
                                  {todo.done ? "已完成" : "进行中"}
                                </Tag>
                                {todo.createdAt && (
                                  <Text type="secondary" className="todo-time">
                                    {formatTime(todo.createdAt)}
                                  </Text>
                                )}
                              </Space>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  )
                ) : (
                  <div className="loading-todos">
                    <Text type="secondary">点击展开查看用户任务</Text>
                  </div>
                )}
              </div>
            </Panel>
          ))}
        </Collapse>
      )}
    </Card>
  );
};

export default AdminPanel;