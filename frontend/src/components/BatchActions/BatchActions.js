import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Dropdown, 
  Checkbox, 
  Typography, 
  Modal,
  Select,
  message,
  Tooltip,
  Badge
} from 'antd';
import { 
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  FlagOutlined,
  TagOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  BulbOutlined
} from '@ant-design/icons';
import './BatchActions.css';

const { Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const BatchActions = ({ 
  selectedTodos = [], 
  onBatchUpdate, 
  onBatchDelete,
  onClearSelection,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchAction, setBatchAction] = useState(null);
  const [batchValue, setBatchValue] = useState(null);

  const selectedCount = selectedTodos.length;

  // 批量操作选项
  const batchActions = [
    {
      key: 'complete',
      label: '标记为已完成',
      icon: <CheckOutlined />,
      color: '#52c41a',
      action: () => handleBatchComplete()
    },
    {
      key: 'incomplete',
      label: '标记为未完成',
      icon: <CheckOutlined />,
      color: '#faad14',
      action: () => handleBatchIncomplete()
    },
    {
      type: 'divider'
    },
    {
      key: 'priority',
      label: '批量设置优先级',
      icon: <FlagOutlined />,
      color: '#1890ff',
      action: () => openBatchModal('priority')
    },
    {
      key: 'category',
      label: '批量设置分类',
      icon: <TagOutlined />,
      color: '#722ed1',
      action: () => openBatchModal('category')
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      color: '#ff4d4f',
      danger: true,
      action: () => handleBatchDelete()
    }
  ];

  // 优先级选项
  const priorityOptions = [
    { value: 'low', label: '低优先级', color: '#52c41a' },
    { value: 'medium', label: '中优先级', color: '#faad14' },
    { value: 'high', label: '高优先级', color: '#ff4d4f' }
  ];

  // 分类选项
  const categoryOptions = [
    { value: 'work', label: '工作' },
    { value: 'personal', label: '个人' },
    { value: 'study', label: '学习' },
    { value: 'health', label: '健康' },
    { value: 'finance', label: '财务' },
    { value: 'family', label: '家庭' }
  ];

  // 打开批量操作模态框
  const openBatchModal = (action) => {
    setBatchAction(action);
    setBatchValue(null);
    setBatchModalVisible(true);
  };

  // 处理批量完成
  const handleBatchComplete = async () => {
    try {
      await onBatchUpdate(selectedTodos.map(todo => todo.id), { done: true });
      message.success(`已将 ${selectedCount} 个任务标记为已完成`);
      onClearSelection();
    } catch (error) {
      message.error('批量操作失败');
    }
  };

  // 处理批量未完成
  const handleBatchIncomplete = async () => {
    try {
      await onBatchUpdate(selectedTodos.map(todo => todo.id), { done: false });
      message.success(`已将 ${selectedCount} 个任务标记为未完成`);
      onClearSelection();
    } catch (error) {
      message.error('批量操作失败');
    }
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    confirm({
      title: '确认批量删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedCount} 个任务吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await onBatchDelete(selectedTodos.map(todo => todo.id));
          message.success(`已删除 ${selectedCount} 个任务`);
          onClearSelection();
        } catch (error) {
          message.error('批量删除失败');
        }
      }
    });
  };

  // 处理批量更新
  const handleBatchModalOk = async () => {
    if (!batchValue) {
      message.warning('请选择一个值');
      return;
    }

    try {
      const updateData = { [batchAction]: batchValue };
      await onBatchUpdate(selectedTodos.map(todo => todo.id), updateData);
      
      const actionName = batchAction === 'priority' ? '优先级' : '分类';
      message.success(`已批量更新 ${selectedCount} 个任务的${actionName}`);
      
      setBatchModalVisible(false);
      onClearSelection();
    } catch (error) {
      message.error('批量更新失败');
    }
  };

  // 如果没有选中任务，不显示组件
  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <Card className={`batch-actions ${className}`} size="small">
        <div className="batch-actions-content">
          <div className="batch-info">
            <Space>
              <Checkbox 
                checked={true}
                onChange={onClearSelection}
              />
              <Badge count={selectedCount} showZero={false}>
                <Text strong>已选择 {selectedCount} 个任务</Text>
              </Badge>
            </Space>
          </div>

          <div className="batch-buttons">
            <Space>
              {/* 快速操作按钮 */}
              <Tooltip title="标记为已完成">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleBatchComplete}
                  size="small"
                  className="quick-action-btn complete-btn"
                >
                  完成
                </Button>
              </Tooltip>

              <Tooltip title="批量删除">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                  size="small"
                  className="quick-action-btn delete-btn"
                >
                  删除
                </Button>
              </Tooltip>

              {/* 更多操作下拉菜单 */}
              <Dropdown
                menu={{ 
                  items: batchActions.map(action => ({
                    ...action,
                    onClick: action.action
                  }))
                }}
                trigger={['click']}
                placement="bottomRight"
                overlayClassName="batch-actions-dropdown"
              >
                <Button
                  icon={<MoreOutlined />}
                  size="small"
                  className="more-actions-btn"
                >
                  更多
                </Button>
              </Dropdown>

              {/* 清除选择 */}
              <Button
                type="text"
                size="small"
                onClick={onClearSelection}
                className="clear-selection-btn"
              >
                取消选择
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* 批量操作模态框 */}
      <Modal
        title={
          <Space>
            {batchAction === 'priority' ? <FlagOutlined /> : <TagOutlined />}
            批量设置{batchAction === 'priority' ? '优先级' : '分类'}
          </Space>
        }
        open={batchModalVisible}
        onOk={handleBatchModalOk}
        onCancel={() => setBatchModalVisible(false)}
        okText="确定"
        cancelText="取消"
        className="batch-modal"
      >
        <div className="batch-modal-content">
          <Text type="secondary">
            将为选中的 {selectedCount} 个任务设置{batchAction === 'priority' ? '优先级' : '分类'}
          </Text>
          
          <div style={{ marginTop: 16 }}>
            <Select
              value={batchValue}
              onChange={setBatchValue}
              placeholder={`选择${batchAction === 'priority' ? '优先级' : '分类'}`}
              style={{ width: '100%' }}
              size="large"
            >
              {(batchAction === 'priority' ? priorityOptions : categoryOptions).map(option => (
                <Option key={option.value} value={option.value}>
                  <Space>
                    {batchAction === 'priority' && (
                      <span 
                        style={{ 
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: option.color
                        }}
                      />
                    )}
                    <span>{option.label}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </div>

          <div className="batch-tip">
            <BulbOutlined style={{ color: '#faad14', marginRight: 8 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              此操作将覆盖所有选中任务的当前设置
            </Text>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BatchActions;
