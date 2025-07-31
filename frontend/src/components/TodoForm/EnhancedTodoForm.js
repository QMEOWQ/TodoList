import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Divider, 
  Select,
  DatePicker,
  Row,
  Col,
  Tooltip,
  Switch,
  message
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  FlagOutlined,
  TagOutlined,
  CalendarOutlined,
  BellOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import './EnhancedTodoForm.css';

const { TextArea } = Input;
const { Option } = Select;

const EnhancedTodoForm = ({ onSubmit, loading = false }) => {
  const [form] = Form.useForm();
  const [steps, setSteps] = useState([]);
  const [newStep, setNewStep] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // 优先级选项
  const priorityOptions = [
    { value: 'low', label: '低优先级', color: '#52c41a', icon: '🟢' },
    { value: 'medium', label: '中优先级', color: '#faad14', icon: '🟡' },
    { value: 'high', label: '高优先级', color: '#ff4d4f', icon: '🔴' }
  ];

  // 分类选项
  const categoryOptions = [
    { value: 'work', label: '工作', icon: '💼' },
    { value: 'personal', label: '个人', icon: '👤' },
    { value: 'study', label: '学习', icon: '📚' },
    { value: 'health', label: '健康', icon: '🏃' },
    { value: 'finance', label: '财务', icon: '💰' },
    { value: 'family', label: '家庭', icon: '👨‍👩‍👧‍👦' }
  ];

  // 添加步骤
  const addStep = () => {
    if (newStep.trim()) {
      setSteps(prev => [...prev, { 
        id: Date.now(), 
        content: newStep.trim(), 
        completed: false 
      }]);
      setNewStep('');
    }
  };

  // 删除步骤
  const removeStep = (stepId) => {
    setSteps(prev => prev.filter(step => step.id !== stepId));
  };

  // 添加标签
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  // 删除标签
  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      const todoData = {
        task: values.task,
        description: values.description || '',
        priority: values.priority || 'medium',
        category: values.category || 'personal',
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        reminder: values.reminder || false,
        estimatedTime: values.estimatedTime || null,
        tags: tags,
        steps: steps
      };

      const success = await onSubmit(todoData);
      if (success) {
        form.resetFields();
        setSteps([]);
        setTags([]);
        setNewStep('');
        setNewTag('');
        message.success('任务创建成功！');
      }
    } catch (error) {
      console.error('提交失败:', error);
      message.error('创建任务失败，请重试');
    }
  };

  // 处理回车键
  const handleStepKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addStep();
    }
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Card 
      title={
        <Space>
          <PlusOutlined />
          创建新任务
        </Space>
      }
      className="enhanced-todo-form-card"
      extra={
        <Tooltip title={isAdvancedMode ? '切换到简单模式' : '切换到高级模式'}>
          <Switch
            checked={isAdvancedMode}
            onChange={setIsAdvancedMode}
            checkedChildren="高级"
            unCheckedChildren="简单"
            size="small"
          />
        </Tooltip>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="enhanced-todo-form"
        initialValues={{
          priority: 'medium',
          category: 'personal',
          reminder: false
        }}
      >
        {/* 基础信息 */}
        <Row gutter={[16, 0]}>
          <Col xs={24} md={isAdvancedMode ? 16 : 24}>
            <Form.Item
              name="task"
              label="任务标题"
              rules={[
                { required: true, message: '请输入任务标题' },
                { max: 100, message: '标题不能超过100个字符' }
              ]}
            >
              <Input 
                placeholder="输入任务标题..." 
                size="large"
                autoComplete="off"
              />
            </Form.Item>
          </Col>
          
          {isAdvancedMode && (
            <Col xs={24} md={8}>
              <Form.Item
                name="priority"
                label="优先级"
              >
                <Select size="large" placeholder="选择优先级">
                  {priorityOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Space>
                        <span>{option.icon}</span>
                        <span style={{ color: option.color }}>{option.label}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row>

        <Form.Item
          name="description"
          label="任务描述"
        >
          <TextArea 
            placeholder="详细描述任务内容（可选）..." 
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* 高级选项 */}
        {isAdvancedMode && (
          <>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="category"
                  label="分类"
                >
                  <Select size="large" placeholder="选择分类">
                    {categoryOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        <Space>
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="dueDate"
                  label="截止日期"
                >
                  <DatePicker 
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="选择截止日期"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    showTime={{ format: 'HH:mm' }}
                    format="YYYY-MM-DD HH:mm"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="estimatedTime"
                  label="预估时间（分钟）"
                >
                  <Input 
                    type="number"
                    size="large"
                    placeholder="预估完成时间"
                    min={1}
                    max={1440}
                    suffix={<ClockCircleOutlined />}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="reminder"
                  label="提醒设置"
                  valuePropName="checked"
                >
                  <div className="reminder-setting">
                    <Switch />
                    <span style={{ marginLeft: 8 }}>
                      <BellOutlined /> 开启提醒
                    </span>
                  </div>
                </Form.Item>
              </Col>
            </Row>

            {/* 标签管理 */}
            <Form.Item label="标签">
              <div className="tags-section">
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="添加标签..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    maxLength={20}
                    prefix={<TagOutlined />}
                  />
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={addTag}
                    disabled={!newTag.trim() || tags.includes(newTag.trim())}
                  >
                    添加
                  </Button>
                </Space.Compact>

                {tags.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <div className="tags-list">
                      {tags.map((tag, index) => (
                        <Tag 
                          key={index}
                          closable
                          onClose={() => removeTag(tag)}
                          closeIcon={<DeleteOutlined />}
                          className="custom-tag"
                          color="blue"
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Form.Item>
          </>
        )}

        {/* 任务步骤 */}
        <Form.Item label="任务步骤">
          <div className="steps-section">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="添加任务步骤..."
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                onKeyPress={handleStepKeyPress}
                maxLength={100}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={addStep}
                disabled={!newStep.trim()}
              >
                添加
              </Button>
            </Space.Compact>

            {steps.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div className="steps-list">
                  {steps.map((step, index) => (
                    <div key={step.id} className="step-item">
                      <span className="step-number">{index + 1}</span>
                      <span className="step-content">{step.content}</span>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeStep(step.id)}
                        className="step-delete"
                        danger
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
            block
            className="submit-button"
          >
            {loading ? '创建中...' : '创建任务'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EnhancedTodoForm;
