import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, List, Space, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const TaskEditModal = ({ todo, visible, onCancel, onSave }) => {
  const [form] = Form.useForm();
  const [editTaskSteps, setEditTaskSteps] = useState([]);
  const [newStep, setNewStep] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (todo && visible) {
      form.setFieldsValue({
        task: todo.task,
        description: todo.description || ""
      });
      setEditTaskSteps(todo.steps ? [...todo.steps] : []);
    }
  }, [todo, visible, form]);

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

  // 处理编辑中步骤内容的变更
  const handleEditStepChange = (index, newContent) => {
    const updatedSteps = [...editTaskSteps];
    updatedSteps[index].content = newContent;
    setEditTaskSteps(updatedSteps);
  };

  // 保存更新
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (!values.task.trim()) {
        message.warning('请输入任务名称');
        return;
      }

      setLoading(true);
      
      const updatedTodo = {
        ...todo,
        task: values.task,
        description: values.description,
        steps: editTaskSteps
      };

      const success = await onSave(updatedTodo);
      if (success) {
        onCancel();
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setEditTaskSteps([]);
    setNewStep("");
    onCancel();
  };

  return (
    <Modal
      title="编辑任务"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          loading={loading}
          onClick={handleSave}
        >
          保存更新
        </Button>
      ]}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          label="任务名称" 
          name="task"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input placeholder="任务名称" size="large" />
        </Form.Item>
        
        <Form.Item label="任务描述" name="description">
          <TextArea 
            placeholder="任务描述（可选）" 
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>
        
        <Form.Item label="任务步骤">
          <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '12px' }}>
            {editTaskSteps.length > 0 && (
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
                      placeholder="步骤内容"
                    />
                  </List.Item>
                )}
              />
            )}
            
            <div style={{ marginTop: editTaskSteps.length > 0 ? '12px' : '0' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input 
                  placeholder="添加新步骤..." 
                  value={newStep} 
                  onChange={(e) => setNewStep(e.target.value)} 
                  onPressEnter={addEditStep}
                />
                <Button 
                  type="primary" 
                  onClick={addEditStep} 
                  icon={<PlusOutlined />}
                  disabled={!newStep.trim()}
                >
                  添加
                </Button>
              </Space.Compact>
            </div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskEditModal;
