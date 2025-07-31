import React, { useState } from 'react';
import { Card, List, Button, Checkbox, Typography, Empty, Spin, Space, Tag, Divider } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  DownOutlined, 
  UpOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import TaskEditModal from './TaskEditModal';
import './TaskListEnhanced.css';

const { Text, Paragraph } = Typography;

const TaskListEnhanced = ({ 
  todos, 
  loading, 
  onToggleTodo, 
  onDeleteTodo, 
  onUpdateTodo,
  onToggleStep 
}) => {
  const [expandedTasks, setExpandedTasks] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  // 切换任务展开状态
  const toggleTaskExpand = (todoId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [todoId]: !prev[todoId]
    }));
  };

  // 切换全部展开/收起
  const toggleAllExpanded = () => {
    if (allExpanded) {
      setExpandedTasks({});
    } else {
      const expandAll = {};
      todos.forEach(todo => {
        expandAll[todo.id] = true;
      });
      setExpandedTasks(expandAll);
    }
    setAllExpanded(!allExpanded);
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

  // 计算任务完成进度
  const getTaskProgress = (todo) => {
    if (!todo.steps || todo.steps.length === 0) {
      return todo.done ? 100 : 0;
    }
    
    const completedSteps = todo.steps.filter(step => step.completed).length;
    return Math.round((completedSteps / todo.steps.length) * 100);
  };

  // 获取任务状态标签
  const getTaskStatusTag = (todo) => {
    const progress = getTaskProgress(todo);
    
    if (todo.done) {
      return <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>;
    } else if (progress > 0) {
      return <Tag color="processing" icon={<ClockCircleOutlined />}>进行中 {progress}%</Tag>;
    } else {
      return <Tag color="default">未开始</Tag>;
    }
  };

  return (
    <Card 
      title={
        <div className="task-list-header">
          <Space>
            <span>我的任务</span>
            <Tag color="blue">{todos.length} 个任务</Tag>
          </Space>
          <Button 
            type="primary" 
            onClick={toggleAllExpanded}
            icon={allExpanded ? <UpOutlined /> : <DownOutlined />}
            className="expand-all-btn glass-button"
          >
            {allExpanded ? "全部收起" : "全部展开"}
          </Button>
        </div>
      } 
      className="task-list-card"
    >
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <Text className="loading-text">加载任务中...</Text>
        </div>
      ) : todos.length === 0 ? (
        <Empty 
          description="暂无任务，快来添加第一个任务吧！" 
          className="empty-state"
        />
      ) : (
        <List
          className="task-list"
          dataSource={todos}
          renderItem={todo => (
            <List.Item
              key={todo.id}
              className={`task-item ${todo.done ? 'completed' : ''}`}
            >
              <div className="task-content">
                <div className="task-main">
                  <div className="task-header">
                    <Checkbox 
                      checked={todo.done} 
                      onChange={() => onToggleTodo(todo.id)}
                      className="task-checkbox"
                    />
                    <div className="task-info">
                      <Text 
                        delete={todo.done} 
                        strong 
                        className="task-title"
                      >
                        {todo.task}
                      </Text>
                      <div className="task-meta">
                        {getTaskStatusTag(todo)}
                        <Text type="secondary" className="task-time">
                          {formatTime(todo.createdAt)}
                        </Text>
                      </div>
                    </div>
                  </div>
                  
                  <div className="task-actions">
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      onClick={() => setEditingTodo(todo)}
                      className="action-btn edit-btn"
                      title="编辑任务"
                    />
                    <Button 
                      type="text" 
                      icon={expandedTasks[todo.id] ? <UpOutlined /> : <DownOutlined />} 
                      onClick={() => toggleTaskExpand(todo.id)}
                      className="action-btn expand-btn"
                      title={expandedTasks[todo.id] ? "收起" : "展开"}
                    />
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => onDeleteTodo(todo.id)}
                      className="action-btn delete-btn"
                      title="删除任务"
                    />
                  </div>
                </div>
                
                {expandedTasks[todo.id] && (
                  <div className="task-details">
                    {todo.description && (
                      <div className="task-description">
                        <Paragraph className="description-text">
                          {todo.description}
                        </Paragraph>
                      </div>
                    )}
                    
                    {todo.steps && todo.steps.length > 0 && (
                      <div className="task-steps">
                        <div className="steps-header">
                          <Text strong>任务步骤</Text>
                          <Tag color="blue">
                            {todo.steps.filter(s => s.completed).length}/{todo.steps.length}
                          </Tag>
                        </div>
                        <List
                          className="steps-list"
                          dataSource={todo.steps}
                          renderItem={step => (
                            <List.Item className="step-item">
                              <Checkbox 
                                checked={step.completed} 
                                onChange={() => onToggleStep(step.id)}
                                className="step-checkbox"
                              />
                              <span className={`step-content ${step.completed ? 'completed' : ''}`}>
                                {step.content}
                              </span>
                            </List.Item>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      )}
      
      {editingTodo && (
        <TaskEditModal
          todo={editingTodo}
          visible={!!editingTodo}
          onCancel={() => setEditingTodo(null)}
          onSave={onUpdateTodo}
        />
      )}
    </Card>
  );
};

export default TaskListEnhanced;
