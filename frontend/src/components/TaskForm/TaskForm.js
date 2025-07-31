import React, { useState } from 'react';
import { Card, Form, Input, Button, List, Space, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import './TaskForm.css';

const { TextArea } = Input;

const TaskForm = ({ onSubmit, loading }) => {
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [currentTaskSteps, setCurrentTaskSteps] = useState([]);
  const [newStep, setNewStep] = useState("");

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

  // 提交任务
  const handleSubmit = async (values) => {
    if (!taskName.trim()) {
      message.warning('请输入任务名称');
      return;
    }

    const taskData = {
      task: taskName,
      description: taskDesc,
      steps: currentTaskSteps
    };

    const success = await onSubmit(taskData);
    if (success) {
      // 重置表单
      setTaskName('');
      setTaskDesc('');
      setCurrentTaskSteps([]);
      setNewStep('');
    }
  };

  // 处理回车键提交
  const handleEnterSubmit = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card
      title="添加新任务"
      className="task-form-card"
    >
      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item 
          label={<span className="form-label">任务名称</span>} 
          required
        >
          <Input 
            placeholder="输入任务名称..." 
            value={taskName} 
            onChange={(e) => setTaskName(e.target.value)} 
            onPressEnter={handleEnterSubmit}
            className="task-input"
            size="large"
          />
        </Form.Item>
        
        <Form.Item label={<span className="form-label">任务描述</span>}>
          <TextArea 
            placeholder="描述任务详情（可选）..." 
            value={taskDesc} 
            onChange={(e) => setTaskDesc(e.target.value)} 
            autoSize={{ minRows: 3, maxRows: 6 }}
            className="task-textarea"
          />
        </Form.Item>
        
        <Form.Item label={<span className="form-label">任务步骤</span>}>
          <div className="steps-container">
            {currentTaskSteps.length > 0 && (
              <List
                className="steps-list"
                dataSource={currentTaskSteps}
                renderItem={(step, index) => (
                  <List.Item className="step-item">
                    <div className="step-content">
                      <span className="step-number">{index + 1}</span>
                      <span className="step-text">{step.content}</span>
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => removeStep(index)}
                      className="delete-step-btn"
                    />
                  </List.Item>
                )}
              />
            )}
            
            <div className="add-step-container">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="添加新步骤..."
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  onPressEnter={addStep}
                  className="step-input"
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  onClick={addStep}
                  icon={<PlusOutlined />}
                  disabled={!newStep.trim()}
                  className="add-step-btn glass-button-primary"
                >
                  添加
                </Button>
              </Space.Compact>
            </div>
          </div>
        </Form.Item>
        
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            disabled={!taskName.trim() || loading}
            loading={loading}
            icon={<PlusOutlined />}
            size="large"
            className="submit-btn glass-button-primary"
            block
          >
            创建任务
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TaskForm;
