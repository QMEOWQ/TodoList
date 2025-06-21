import React, { useState } from 'react';
import { List, Checkbox, Button, Card, Typography, Space } from 'antd';
import { EditOutlined, DeleteOutlined, ExpandAltOutlined } from '@ant-design/icons';
import './styles/TaskList.css';

const { Text, Title } = Typography;

// 日期格式化函数
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

const TaskItem = ({ task, onToggleComplete, onDelete, onToggleExpand, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
    onToggleExpand(task.id);
  };
  
  // 添加步骤完成状态切换函数
  const onToggleStepComplete = (taskId, stepId) => {
    // 这个函数应该通过 props 传递，但在这里我们先添加一个临时实现
    console.log(`Toggle step ${stepId} for task ${taskId}`);
    // 实际实现应该更新任务中的步骤状态
  };
  
  return (
    <Card className="task-item" bordered={false}>
      <div className="task-item-content">
        <div className="task-item-header">
          <div className="task-item-left">
            <Checkbox 
              checked={task.completed} 
              onChange={() => onToggleComplete(task.id)}
              className="task-checkbox"
            />
            <Text className={`task-title ${task.completed ? 'completed' : ''}`}>
              {task.title}
            </Text>
          </div>
          <div className="task-item-right">
            <Text className="task-time">{formatDate(task.created_at || new Date())}</Text>
          </div>
        </div>
        
        <div className="task-actions">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => onEdit(task)} 
            className="action-button"
          >
            更新
          </Button>
          <Button 
            type="text" 
            icon={<ExpandAltOutlined />} 
            onClick={handleToggleExpand} 
            className="action-button"
          >
            {expanded ? '收起' : '展开'}
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => onDelete(task.id)} 
            className="action-button danger"
          >
            删除
          </Button>
        </div>
        
        {expanded && task.steps && task.steps.length > 0 && (
          <div className="task-steps">
            {task.steps.map((step) => (
              <div key={step.id} className="step-item">
                <Checkbox 
                  checked={step.completed} 
                  onChange={() => onToggleStepComplete(task.id, step.id)}
                  className="step-checkbox"
                />
                <Text className={`step-title ${step.completed ? 'completed' : ''}`}>
                  {step.description}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

const TaskList = ({ tasks = [], onToggleComplete, onDelete, onToggleExpand, onEdit }) => {
  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <Title level={4}>我的任务</Title>
        <Button type="primary">全部展开</Button>
      </div>
      
      <List
        dataSource={tasks}
        renderItem={(task) => (
          <TaskItem 
            key={task.id}
            task={task} 
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            onToggleExpand={onToggleExpand}
            onEdit={onEdit}
          />
        )}
        locale={{ emptyText: '暂无任务' }}
      />
    </div>
  );
};

export default TaskList;